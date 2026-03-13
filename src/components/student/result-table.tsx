import type { SqlResult } from "@/lib/sql/types";

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ResultTable({ result }: { result: SqlResult }) {
  if (result.columns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Query ran but returned no columns.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {result.columns.map((column, index) => (
                <th key={index} className="px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={result.columns.length}
                  className="text-muted-foreground px-3 py-4 text-center"
                >
                  No rows
                </td>
              </tr>
            ) : (
              result.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {result.columns.map((column, colIndex) => {
                    const value = renderCell(row[column]);
                    return (
                      <td
                        key={colIndex}
                        className={
                          value === "NULL"
                            ? "text-muted-foreground px-3 py-2 font-mono text-xs italic"
                            : "px-3 py-2 font-mono text-xs"
                        }
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-xs">
        {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
        {result.truncated ? ` (showing first ${result.rows.length})` : ""}
      </p>
    </div>
  );
}
