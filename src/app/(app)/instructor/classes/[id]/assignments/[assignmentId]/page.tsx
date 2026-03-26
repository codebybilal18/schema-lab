import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { deleteAssignment } from "@/lib/actions/classroom";
import { quizStatus, formatDateTime } from "@/lib/quiz";
import { DeleteButton } from "@/components/instructor/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function InstructorAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const user = await requireInstructor();

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      classroom: {
        select: {
          id: true,
          name: true,
          instructorId: true,
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { joinedAt: "asc" },
          },
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
            },
          },
        },
      },
      submissions: {
        where: { passed: true },
        select: { userId: true, problemId: true },
      },
    },
  });

  if (
    !assignment ||
    assignment.classroom.id !== id ||
    assignment.classroom.instructorId !== user.id
  ) {
    notFound();
  }

  const status = quizStatus(assignment);
  const totalProblems = assignment.problems.length;

  const solvedByUser = new Map<string, Set<string>>();
  for (const submission of assignment.submissions) {
    const set = solvedByUser.get(submission.userId) ?? new Set<string>();
    set.add(submission.problemId);
    solvedByUser.set(submission.userId, set);
  }

  const results = assignment.classroom.members.map((member) => ({
    id: member.id,
    name: member.user.name,
    email: member.user.email,
    solved: solvedByUser.get(member.user.id)?.size ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/instructor/classes/${assignment.classroom.id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to {assignment.classroom.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{assignment.title}</h1>
            <p className="text-muted-foreground text-sm">
              {status.isQuiz ? "Quiz" : "Practice"}
              {status.isQuiz ? ` - ${status.label}` : ""}
            </p>
          </div>
          <DeleteButton
            action={deleteAssignment.bind(null, assignment.id)}
            title="Delete assignment?"
            description="This removes the assignment. Student submissions on the problems are kept."
            redirectTo={`/instructor/classes/${assignment.classroom.id}`}
          />
        </div>
      </div>

      {status.isQuiz && (assignment.opensAt || assignment.closesAt) && (
        <p className="text-muted-foreground text-sm">
          {assignment.opensAt
            ? `Opens ${formatDateTime(assignment.opensAt)}`
            : "Opens immediately"}
          {" - "}
          {assignment.closesAt
            ? `closes ${formatDateTime(assignment.closesAt)}`
            : "no close time"}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Problems ({totalProblems})</h2>
        <div className="space-y-2">
          {assignment.problems.map(({ problem }) => (
            <Card key={problem.id}>
              <CardHeader>
                <CardTitle className="text-base">{problem.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {problem.dataset.title} -{" "}
                  {DIFFICULTY_LABEL[problem.difficulty] ?? problem.difficulty}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          {status.isQuiz ? "Results" : "Progress"} ({results.length} student
          {results.length === 1 ? "" : "s"})
        </h2>
        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No students have joined this class yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Student</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 text-right font-medium">Solved</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="border-t">
                    <td className="px-3 py-2">{result.name}</td>
                    <td className="text-muted-foreground px-3 py-2">
                      {result.email}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {result.solved} / {totalProblems}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
