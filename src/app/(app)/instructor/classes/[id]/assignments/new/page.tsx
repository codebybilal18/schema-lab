import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { AssignmentForm } from "@/components/classroom/assignment-form";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireInstructor();

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.instructorId !== user.id) {
    notFound();
  }

  const problems = await prisma.problem.findMany({
    where: { OR: [{ authorId: null }, { authorId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { dataset: { select: { title: true } } },
  });

  const options = problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    datasetTitle: problem.dataset.title,
    difficulty: problem.difficulty,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/instructor/classes/${classroom.id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to {classroom.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New assignment</h1>
      </div>
      <AssignmentForm classroomId={classroom.id} problems={options} />
    </div>
  );
}
