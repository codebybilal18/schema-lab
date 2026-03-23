import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Problems",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function ProblemsPage() {
  const user = await requireUser();

  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dataset: { select: { title: true } },
      submissions: {
        where: { userId: user.id, passed: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Problems</h1>
        <p className="text-muted-foreground">
          Pick a problem and write a query to solve it.
        </p>
      </div>

      {problems.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No problems are available yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {problems.map((problem) => {
            const solved = problem.submissions.length > 0;
            return (
              <Link key={problem.id} href={`/problems/${problem.id}`}>
                <Card className="hover:border-primary/50 h-full transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {problem.title}
                      </CardTitle>
                      {solved && (
                        <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      )}
                    </div>
                    <CardDescription>{problem.dataset.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>
                      {DIFFICULTY_LABEL[problem.difficulty] ??
                        problem.difficulty}
                    </span>
                    {problem.authorId === null && (
                      <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
                        Official
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
