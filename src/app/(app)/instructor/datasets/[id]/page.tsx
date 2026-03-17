import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { deleteDataset, deleteProblem } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/instructor/delete-button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/instructor/datasets/${dataset.id}/edit`} />}
            >
              Edit
            </Button>
            <DeleteButton
              action={deleteDataset.bind(null, dataset.id)}
              confirmMessage="Delete this dataset and all of its problems? This cannot be undone."
              redirectTo="/instructor"
            />
            <Button
              size="sm"
              render={
                <Link
                  href={`/instructor/datasets/${dataset.id}/problems/new`}
                />
              }
            >
              Add problem
            </Button>
          </div>
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
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {problem.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {problem.difficulty}
                        {problem.orderMatters ? " - order matters" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/instructor/datasets/${dataset.id}/problems/${problem.id}/edit`}
                          />
                        }
                      >
                        Edit
                      </Button>
                      <DeleteButton
                        action={deleteProblem.bind(null, problem.id)}
                        confirmMessage="Delete this problem? This cannot be undone."
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
