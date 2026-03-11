import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Instructor",
};

export default async function InstructorPage() {
  const user = await requireInstructor();

  const datasets = await prisma.dataset.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { problems: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your datasets</h1>
          <p className="text-muted-foreground">
            Seed a database, then add problems for students to solve.
          </p>
        </div>
        <Button render={<Link href="/instructor/datasets/new" />}>
          New dataset
        </Button>
      </div>

      {datasets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No datasets yet</CardTitle>
            <CardDescription>
              Create your first dataset to start authoring problems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/instructor/datasets/new" />}>
              Create a dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {datasets.map((dataset) => (
            <Link key={dataset.id} href={`/instructor/datasets/${dataset.id}`}>
              <Card className="hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <CardTitle>{dataset.title}</CardTitle>
                  {dataset.description && (
                    <CardDescription>{dataset.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {dataset._count.problems} problem
                  {dataset._count.problems === 1 ? "" : "s"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
