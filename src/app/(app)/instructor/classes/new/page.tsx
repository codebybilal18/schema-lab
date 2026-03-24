import Link from "next/link";
import type { Metadata } from "next";

import { requireInstructor } from "@/lib/session";
import { ClassForm } from "@/components/classroom/class-form";

export const metadata: Metadata = {
  title: "New class",
};

export default async function NewClassPage() {
  await requireInstructor();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/instructor/classes"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to classes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New class</h1>
      </div>
      <ClassForm />
    </div>
  );
}
