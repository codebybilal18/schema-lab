import type { TableSchema } from "@/lib/sql/schema";

export function SchemaView({ schema }: { schema: TableSchema[] }) {
  if (schema.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This dataset has no tables.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schema.map((table) => (
        <div key={table.name} className="overflow-hidden rounded-lg border">
          <div className="bg-muted border-b px-3 py-2 font-mono text-sm font-medium">
            {table.name}
          </div>
          <ul className="divide-y">
            {table.columns.map((column) => (
              <li
                key={column.name}
                className="flex items-center justify-between gap-4 px-3 py-1.5"
              >
                <span className="font-mono text-sm">{column.name}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {column.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
