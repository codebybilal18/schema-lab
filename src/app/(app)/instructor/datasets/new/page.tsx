import Link from "next/link";
import type { Metadata } from "next";

import { requireInstructor } from "@/lib/session";
import { DatasetForm } from "@/components/instructor/dataset-form";

export const metadata: Metadata = {
  title: "New dataset",
};

export default async function NewDatasetPage() {
  await requireInstructor();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/instructor"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to datasets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New dataset</h1>
      </div>
      <DatasetForm />
    </div>
  );
}
