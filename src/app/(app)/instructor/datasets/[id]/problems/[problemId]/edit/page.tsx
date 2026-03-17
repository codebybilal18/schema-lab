import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { ProblemForm } from "@/components/instructor/problem-form";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id, problemId } = await params;
  const user = await requireInstructor();

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });
  if (!problem || problem.authorId !== user.id || problem.datasetId !== id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/instructor/datasets/${id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to dataset
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit problem</h1>
      </div>
      <ProblemForm
        datasetId={id}
        problem={{
          id: problem.id,
          title: problem.title,
          prompt: problem.prompt,
          solutionQuery: problem.solutionQuery,
          orderMatters: problem.orderMatters,
          difficulty: problem.difficulty,
        }}
      />
    </div>
  );
}
