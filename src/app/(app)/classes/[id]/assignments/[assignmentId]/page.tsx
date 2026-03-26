import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { quizStatus } from "@/lib/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const user = await requireUser();

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      classroom: {
        select: {
          id: true,
          name: true,
          instructorId: true,
          members: { where: { userId: user.id }, select: { id: true } },
        },
      },
      problems: {
        orderBy: { position: "asc" },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              dataset: { select: { title: true } },
              submissions: {
                where: { userId: user.id, passed: true },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const isMember = assignment
    ? assignment.classroom.members.length > 0
    : false;
  if (
    !assignment ||
    assignment.classroom.id !== id ||
    (!isMember && assignment.classroom.instructorId !== user.id)
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/classes/${assignment.classroom.id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to {assignment.classroom.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{assignment.title}</h1>
      </div>

      {(() => {
        const status = quizStatus(assignment);
        if (!status.isQuiz) return null;
        return (
          <div
            className={
              status.open
                ? "rounded-lg border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400"
                : "border-muted-foreground/20 bg-muted text-muted-foreground rounded-lg border p-3 text-sm"
            }
          >
            <span className="font-medium">Quiz</span> - {status.label}
            {!status.open &&
              ". Submissions are not accepted outside the quiz window."}
          </div>
        );
      })()}

      <div className="space-y-2">
        {assignment.problems.map(({ problem }) => {
          const solved = problem.submissions.length > 0;
          return (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}?assignmentId=${assignment.id}&classId=${assignment.classroom.id}`}
              className="block"
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{problem.title}</CardTitle>
                    {solved && (
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {problem.dataset.title} -{" "}
                  {DIFFICULTY_LABEL[problem.difficulty] ?? problem.difficulty}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
