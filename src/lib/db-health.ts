import "server-only";

import { redirect } from "next/navigation";
import { Client } from "pg";

// How long a health result is trusted before we ping again. Successful checks
// are cached longer (the DB is up, no need to keep asking); failures are
// re-checked sooner so the app recovers quickly once the database is back.
const HEALTHY_TTL_MS = 15_000;
const UNHEALTHY_TTL_MS = 3_000;
// A paused/unreachable database can hang the connection instead of failing
// fast, so cap how long a single connection attempt may take. Neon resumes a
// suspended compute on connect, which takes a few seconds, so keep this
// generous enough not to flag a database that is merely waking up.
const PING_TIMEOUT_MS = 8_000;

let lastCheck: { ok: boolean; at: number } | null = null;
let inFlight: Promise<boolean> | null = null;

// A short-lived direct connection (not the Prisma pool) is used for the probe:
// it fails fast on an unreachable host and is decoupled from the app's query
// pool, so a health check can never interfere with real queries.
async function ping(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return false;

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: PING_TIMEOUT_MS,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch (e) {
    console.error(
      "[db-health] database unreachable:",
      e instanceof Error ? e.message : e,
    );
    return false;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

/**
 * Returns whether the database is reachable, using a short-lived cache so we do
 * not probe on every request. Concurrent callers share a single in-flight probe.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  const now = Date.now();

  if (lastCheck) {
    const ttl = lastCheck.ok ? HEALTHY_TTL_MS : UNHEALTHY_TTL_MS;
    if (now - lastCheck.at < ttl) {
      return lastCheck.ok;
    }
  }

  if (!inFlight) {
    inFlight = ping().then((ok) => {
      lastCheck = { ok, at: Date.now() };
      inFlight = null;
      return ok;
    });
  }

  return inFlight;
}

/**
 * Redirects to the "database paused" page when the database is unreachable.
 * Called from the session gate, so it guards every page and server action that
 * requires a session. The paused page itself performs no database work, so it
 * never triggers this check (no redirect loop).
 */
export async function ensureDatabaseAvailable(): Promise<void> {
  if (!(await isDatabaseReachable())) {
    redirect("/database-paused");
  }
}
