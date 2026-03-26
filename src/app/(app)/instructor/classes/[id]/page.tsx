import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { deleteClassroom } from "@/lib/actions/classroom";
import { quizStatus } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/instructor/delete-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InstructorClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireInstructor();

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { problems: true } } },
      },
    },
  });

  if (!classroom || classroom.instructorId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/instructor/classes"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to classes
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{classroom.name}</h1>
            {classroom.description && (
              <p className="text-muted-foreground">{classroom.description}</p>
            )}
          </div>
          <DeleteButton
            action={deleteClassroom.bind(null, classroom.id)}
            title="Delete class?"
            description="This removes the class, its assignments, and all memberships. Student submissions are kept. This cannot be undone."
            redirectTo="/instructor/classes"
          />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Join code</h2>
        <div className="bg-muted inline-block rounded-lg px-4 py-2 font-mono text-lg tracking-widest">
          {classroom.joinCode}
        </div>
        <p className="text-muted-foreground text-sm">
          Students join at the Classes page using this code.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Assignments ({classroom.assignments.length})
          </h2>
          <Button
            size="sm"
            render={
              <Link
                href={`/instructor/classes/${classroom.id}/assignments/new`}
              />
            }
          >
            New assignment
          </Button>
        </div>
        {classroom.assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No assignments yet. Create one to give students a problem set.
          </p>
        ) : (
          <div className="space-y-2">
            {classroom.assignments.map((assignment) => {
              const status = quizStatus(assignment);
              return (
                <Link
                  key={assignment.id}
                  href={`/instructor/classes/${classroom.id}/assignments/${assignment.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">
                          {assignment.title}
                        </CardTitle>
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                          {status.isQuiz ? `Quiz - ${status.label}` : "Practice"}
                        </span>
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

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          Students ({classroom.members.length})
        </h2>
        {classroom.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No students have joined yet. Share the join code above.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {classroom.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span>{member.user.name}</span>
                <span className="text-muted-foreground">
                  {member.user.email}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
