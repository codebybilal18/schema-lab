import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { quizStatus } from "@/lib/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      instructor: { select: { name: true } },
      members: { where: { userId: user.id }, select: { id: true } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { problems: true } } },
      },
    },
  });

  const isMember = classroom ? classroom.members.length > 0 : false;
  if (!classroom || (!isMember && classroom.instructorId !== user.id)) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/classes"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to classes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{classroom.name}</h1>
        <p className="text-muted-foreground">{classroom.instructor.name}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Assignments</h2>
        {classroom.assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No assignments yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-2">
            {classroom.assignments.map((assignment) => {
              const status = quizStatus(assignment);
              return (
                <Link
                  key={assignment.id}
                  href={`/classes/${classroom.id}/assignments/${assignment.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">
                          {assignment.title}
                        </CardTitle>
                        {status.isQuiz && (
                          <span
                            className={
                              status.open
                                ? "rounded bg-green-600/10 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                                : "bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium"
                            }
                          >
                            Quiz - {status.label}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                      {assignment._count.problems} problem
                      {assignment._count.problems === 1 ? "" : "s"}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
