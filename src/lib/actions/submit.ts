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
  assignmentId: z.string().optional(),
});

export async function submitSolution(input: {
  problemId: string;
  query: string;
  assignmentId?: string;
}): Promise<SubmitResult> {
  const user = await requireUser();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { problemId, query, assignmentId } = parsed.data;

  // If solving under an assignment the student belongs to, tie the submission
  // to it and, for quizzes, enforce the open/close window.
  let recordedAssignmentId: string | null = null;
  if (assignmentId) {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        problems: { some: { problemId } },
        classroom: { members: { some: { userId: user.id } } },
      },
      select: { id: true, type: true, opensAt: true, closesAt: true },
    });
    if (assignment) {
      recordedAssignmentId = assignment.id;
      if (assignment.type === "QUIZ") {
        const now = new Date();
        if (assignment.opensAt && now < assignment.opensAt) {
          return { ok: false, error: "This quiz has not opened yet." };
        }
        if (assignment.closesAt && now > assignment.closesAt) {
          return { ok: false, error: "This quiz has closed." };
        }
      }
    }
  }

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
      assignmentId: recordedAssignmentId,
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
