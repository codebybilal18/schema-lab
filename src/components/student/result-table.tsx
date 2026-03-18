"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SqlResult } from "@/lib/sql/types";

const PAGE_SIZE = 25;

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ResultTable({ result }: { result: SqlResult }) {
  const [page, setPage] = useState(0);

  // Reset to the first page whenever a new result comes in.
  useEffect(() => {
    setPage(0);
  }, [result]);

  if (result.columns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Query ran but returned no columns.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(result.rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageRows = result.rows.slice(start, start + PAGE_SIZE);
  const showPager = result.rows.length > PAGE_SIZE;

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
              pageRows.map((row, rowIndex) => (
                <tr key={start + rowIndex} className="border-t">
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

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs">
          {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
          {result.truncated ? ` (fetched first ${result.rows.length})` : ""}
        </p>
        {showPager && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {start + 1}-{Math.min(start + PAGE_SIZE, result.rows.length)} of{" "}
              {result.rows.length}
            </span>
            <Button
              size="xs"
              variant="outline"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Prev
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
