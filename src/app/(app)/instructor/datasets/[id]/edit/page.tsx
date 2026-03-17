import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { DatasetForm } from "@/components/instructor/dataset-form";

export default async function EditDatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireInstructor();

  const dataset = await prisma.dataset.findUnique({ where: { id } });
  if (!dataset || dataset.authorId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/instructor/datasets/${dataset.id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to {dataset.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit dataset</h1>
      </div>
      <DatasetForm
        dataset={{
          id: dataset.id,
          title: dataset.title,
          description: dataset.description,
          seedSql: dataset.seedSql,
        }}
      />
    </div>
  );
}
