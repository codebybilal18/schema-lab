import { Worker } from "node:worker_threads";

import type { RunOptions, SqlRunOutcome } from "./types";

const DEFAULT_MAX_ROWS = 1000;
const DEFAULT_TIMEOUT_MS = 5000;
// Booting PGlite (compiling the Postgres wasm + running initdb + seeding) is a
// one-off cold-start cost that is separate from the user's query. It is given
// its own, more generous budget so a slow cold start is not mistaken for a
// runaway query.
const DEFAULT_BOOT_TIMEOUT_MS = 20000;

// The worker runs an ephemeral in-memory Postgres (PGlite) instance from an
// inline source string. All PGlite module resolution happens INSIDE this string,
// which the bundler never parses. Doing it in the parent module instead makes
// webpack/turbopack rewrite the require into a numeric module id or fail the
// build with "expression is too dynamic". The worker resolves PGlite via a
// require rooted at the process working directory (/var/task on the server),
// where serverExternalPackages + outputFileTracingIncludes place the package.
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const { createRequire } = require("node:module");

(async () => {
  const { seedSql, query, maxRows } = workerData;
  const requireFromCwd = createRequire(process.cwd() + "/index.js");
  const { PGlite } = requireFromCwd("@electric-sql/pglite");
  const db = new PGlite();
  try {
    await db.exec(seedSql);
    // Signal that boot + seeding is done so the parent can switch from the boot
    // budget to the tighter per-query time limit.
    parentPort.postMessage({ type: "ready" });
    const res = await db.query(query);
    const columns = res.fields.map((field) => field.name);
    const allRows = res.rows;
    const truncated = allRows.length > maxRows;
    parentPort.postMessage({
      ok: true,
      result: {
        columns,
        rows: truncated ? allRows.slice(0, maxRows) : allRows,
        rowCount: allRows.length,
        truncated,
      },
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);
    parentPort.postMessage({ ok: false, error: message });
  } finally {
    try {
      await db.close();
    } catch {}
  }
})();
`;

/**
 * Runs a single SQL query against a fresh, ephemeral Postgres instance seeded
 * with `seedSql`. Execution happens in a worker thread that is hard-terminated
 * if it exceeds the time limit, so runaway queries cannot block the server.
 */
export function runSeededQuery(
  seedSql: string,
  query: string,
  options: RunOptions = {},
): Promise<SqlRunOutcome> {
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const bootTimeoutMs = options.bootTimeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;

  return new Promise((resolve) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { seedSql, query, maxRows },
    });

    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const settle = (outcome: SqlRunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(outcome);
    };

    // While the database boots and seeds, the generous boot budget applies. Once
    // the worker reports it is ready, swap to the tighter per-query limit.
    timer = setTimeout(() => {
      settle({
        ok: false,
        error: `Database took too long to start (over ${bootTimeoutMs}ms)`,
      });
    }, bootTimeoutMs);

    worker.on(
      "message",
      (message: SqlRunOutcome | { type: "ready" }) => {
        if ("type" in message) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            settle({
              ok: false,
              error: `Query exceeded the ${timeoutMs}ms time limit`,
            });
          }, timeoutMs);
          return;
        }
        settle(message);
      },
    );
    worker.on("error", (error) => settle({ ok: false, error: error.message }));
    worker.on("exit", () => {
      settle({ ok: false, error: "Query execution failed" });
    });
  });
}
