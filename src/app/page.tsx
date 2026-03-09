import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Learn SQL by writing SQL
        </h1>
        <p className="text-muted-foreground text-lg">
          Practice against real databases in your browser and get instant,
          structured feedback on every query. No setup, no local installs.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Get started
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>
      </div>
    </main>
  );
}
