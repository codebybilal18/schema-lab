import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SolvePanel } from "@/components/student/solve-panel";
import { SchemaView } from "@/components/student/schema-view";
import { SubmissionHistory } from "@/components/student/submission-history";
import { Markdown } from "@/components/markdown";
import type { TableSchema } from "@/lib/sql/schema";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function SolveProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      dataset: { select: { title: true, schemaInfo: true } },
      submissions: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, query: true, passed: true, createdAt: true },
      },
    },
  });

  if (!problem) {
    notFound();
  }

  const solved = problem.submissions.some((submission) => submission.passed);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/problems"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to problems
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{problem.title}</h1>
          {solved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="size-4" /> Solved
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {problem.dataset.title} -{" "}
          {DIFFICULTY_LABEL[problem.difficulty] ?? problem.difficulty}
          {problem.orderMatters ? " - row order matters" : ""}
        </p>
      </div>

      <Markdown>{problem.prompt}</Markdown>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Tables</h2>
        <SchemaView
          schema={
            (problem.dataset.schemaInfo as unknown as TableSchema[] | null) ??
            []
          }
        />
      </section>

      <SolvePanel problemId={problem.id} initialQuery="" />

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Your attempts</h2>
        <SubmissionHistory submissions={problem.submissions} />
      </section>
    </div>
  );
}
