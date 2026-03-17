import { runSeededQuery } from "./sandbox";

export type TableColumn = { name: string; type: string };
export type TableSchema = { name: string; columns: TableColumn[] };

const INTROSPECT_SQL = `
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`;

/**
 * Runs a dataset's seed SQL and reads back its table and column structure.
 * Doubles as validation that the seed SQL executes.
 */
export async function introspectSchema(
  seedSql: string,
): Promise<
  { ok: true; schema: TableSchema[] } | { ok: false; error: string }
> {
  const run = await runSeededQuery(seedSql, INTROSPECT_SQL, {
    timeoutMs: 8000,
  });
  if (!run.ok) {
    return { ok: false, error: run.error };
  }

  const byTable = new Map<string, TableColumn[]>();
  for (const row of run.result.rows) {
    const table = String(row.table_name);
    const columns = byTable.get(table) ?? [];
    columns.push({
      name: String(row.column_name),
      type: String(row.data_type),
    });
    byTable.set(table, columns);
  }

  const schema: TableSchema[] = Array.from(byTable.entries()).map(
    ([name, columns]) => ({ name, columns }),
  );

  return { ok: true, schema };
}
