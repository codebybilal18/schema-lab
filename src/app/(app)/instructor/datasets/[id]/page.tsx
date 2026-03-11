import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireInstructor();

  const dataset = await prisma.dataset.findUnique({
    where: { id },
    include: {
      problems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!dataset || dataset.authorId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/instructor"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to datasets
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{dataset.title}</h1>
            {dataset.description && (
              <p className="text-muted-foreground">{dataset.description}</p>
            )}
          </div>
          <Button
            render={
              <Link href={`/instructor/datasets/${dataset.id}/problems/new`} />
            }
          >
            Add problem
          </Button>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Seed SQL</h2>
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
          <code className="font-mono">{dataset.seedSql}</code>
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          Problems ({dataset.problems.length})
        </h2>
        {dataset.problems.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No problems yet. Add one to let students practice.
          </p>
        ) : (
          <div className="space-y-2">
            {dataset.problems.map((problem) => (
              <Card key={problem.id}>
                <CardHeader>
                  <CardTitle className="text-base">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {problem.difficulty}
                  {problem.orderMatters ? " - order matters" : ""}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
