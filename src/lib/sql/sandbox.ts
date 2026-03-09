import { Worker } from "node:worker_threads";

import type { RunOptions, SqlRunOutcome } from "./types";

const DEFAULT_MAX_ROWS = 1000;
const DEFAULT_TIMEOUT_MS = 5000;

// The worker runs an ephemeral in-memory Postgres (PGlite) instance. It is
// spawned from an inline source string so there is no separate file to resolve
// or bundle. PGlite is loaded from node_modules via a dynamic import (it is
// listed in serverExternalPackages, so it is never bundled).
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");

(async () => {
  const { seedSql, query, maxRows } = workerData;
  const { PGlite } = await import("@electric-sql/pglite");
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
      workerData: { seedSql, query, maxRows },
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
