import { createRequire } from "node:module";
import { Worker } from "node:worker_threads";

import type { RunOptions, SqlRunOutcome } from "./types";

const DEFAULT_MAX_ROWS = 1000;
const DEFAULT_TIMEOUT_MS = 5000;

// Resolve PGlite to an absolute path here in the parent module, where module
// resolution works and where the deploy-time file tracer can see the reference
// (so the package is actually shipped into the serverless function). The worker
// below runs from an eval'd source string with no resolvable package root, so it
// cannot resolve the bare "@electric-sql/pglite" specifier on its own.
// Named nodeRequire (not "require") on purpose: bundlers rewrite any literal
// `require.resolve(...)` into a numeric module id, which the worker cannot load.
const nodeRequire = createRequire(import.meta.url);
const PGLITE_ENTRY = nodeRequire.resolve("@electric-sql/pglite");

// The worker runs an ephemeral in-memory Postgres (PGlite) instance. It is
// spawned from an inline source string so there is no separate file to resolve
// or bundle. PGlite is loaded by absolute path (passed via workerData) rather
// than a bare specifier, which the eval'd worker cannot resolve.
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");

(async () => {
  const { seedSql, query, maxRows, pglitePath } = workerData;
  const { PGlite } = require(pglitePath);
  const db = new PGlite();
  try {
    await db.exec(seedSql);
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

  return new Promise((resolve) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { seedSql, query, maxRows, pglitePath: PGLITE_ENTRY },
    });

    let settled = false;

    const settle = (outcome: SqlRunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      settle({
        ok: false,
        error: `Query exceeded the ${timeoutMs}ms time limit`,
      });
    }, timeoutMs);

    worker.on("message", (message: SqlRunOutcome) => settle(message));
    worker.on("error", (error) => settle({ ok: false, error: error.message }));
    worker.on("exit", () => {
      settle({ ok: false, error: "Query execution failed" });
    });
  });
}
