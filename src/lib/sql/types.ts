export type SqlRow = Record<string, unknown>;

export type SqlResult = {
  columns: string[];
  rows: SqlRow[];
  rowCount: number;
  truncated: boolean;
};

export type SqlRunOutcome =
  | { ok: true; result: SqlResult }
  | { ok: false; error: string };

export type RunOptions = {
  maxRows?: number;
  timeoutMs?: number;
};
