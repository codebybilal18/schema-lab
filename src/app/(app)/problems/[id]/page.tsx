import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SolvePanel } from "@/components/student/solve-panel";
import { Markdown } from "@/components/markdown";

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
      dataset: { select: { title: true, seedSql: true } },
      submissions: {
        where: { userId: user.id, passed: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!problem) {
    notFound();
  }

  const solved = problem.submissions.length > 0;

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

      <details className="rounded-lg border">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer px-4 py-2 text-sm">
          Database schema and sample data
        </summary>
        <pre className="bg-muted overflow-x-auto border-t p-4 text-xs">
          <code className="font-mono">{problem.dataset.seedSql}</code>
        </pre>
      </details>

      <SolvePanel problemId={problem.id} initialQuery="" />
    </div>
  );
}
