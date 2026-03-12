"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { runSeededQuery } from "@/lib/sql/sandbox";
import { gradeResult, type RowDiff } from "@/lib/sql/grade";
import type { SqlResult } from "@/lib/sql/types";

export type SubmitResult =
  | { ok: false; error: string }
  | {
      ok: true;
      passed: boolean;
      reason: string | null;
      result: SqlResult;
      rowDiffs: RowDiff[];
    };

const schema = z.object({
  problemId: z.string().min(1),
  query: z.string().trim().min(1, "Write a query first").max(10_000),
});

export async function submitSolution(input: {
  problemId: string;
  query: string;
}): Promise<SubmitResult> {
  const user = await requireUser();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { problemId, query } = parsed.data;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { dataset: { select: { seedSql: true } } },
  });
  if (!problem || !problem.expectedResult) {
    return { ok: false, error: "Problem not found" };
  }

  const run = await runSeededQuery(problem.dataset.seedSql, query);
  if (!run.ok) {
    return { ok: false, error: run.error };
  }

  const expected = problem.expectedResult as unknown as SqlResult;
  const grade = gradeResult(expected, run.result, {
    orderMatters: problem.orderMatters,
  });

  await prisma.submission.create({
    data: {
      query,
      passed: grade.passed,
      score: grade.passed ? 100 : 0,
      resultDiff: JSON.parse(
        JSON.stringify({ reason: grade.reason, rowDiffs: grade.rowDiffs }),
      ),
      problemId,
      userId: user.id,
    },
  });

  return {
    ok: true,
    passed: grade.passed,
    reason: grade.reason,
    result: run.result,
    rowDiffs: grade.rowDiffs,
  };
}
