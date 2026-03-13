"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { submitSolution, type SubmitResult } from "@/lib/actions/submit";
import { Button } from "@/components/ui/button";
import { SqlEditor } from "@/components/student/sql-editor";
import { ResultTable } from "@/components/student/result-table";

export function SolvePanel({
  problemId,
  initialQuery,
}: {
  problemId: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isRunning, setIsRunning] = useState(false);
  const [outcome, setOutcome] = useState<SubmitResult | null>(null);

  async function run() {
    if (!query.trim()) {
      toast.error("Write a query first");
      return;
    }

    setIsRunning(true);
    const result = await submitSolution({ problemId, query });
    setIsRunning(false);
    setOutcome(result);

    if (result.ok && result.passed) {
      toast.success("Correct!");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <SqlEditor value={query} onChange={setQuery} />

      <div className="flex justify-end">
        <Button onClick={run} disabled={isRunning}>
          {isRunning ? "Running..." : "Run and submit"}
        </Button>
      </div>

      {outcome && !outcome.ok && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Your query has an error</p>
            <p className="font-mono text-xs">{outcome.error}</p>
          </div>
        </div>
      )}

      {outcome && outcome.ok && (
        <div className="space-y-4">
          {outcome.passed ? (
            <div className="flex items-start gap-2 rounded-lg border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p className="font-medium">
                Correct! Your result matches the expected answer.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Not quite</p>
                {outcome.reason && <p>{outcome.reason}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your result</h3>
            <ResultTable result={outcome.result} />
          </div>
        </div>
      )}
    </div>
  );
}
