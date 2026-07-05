import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/codebybilal18/schema-lab";

export const metadata: Metadata = {
  title: "Database paused - Schema Lab",
  description: "The database for this instance is currently unavailable.",
};

export default function DatabasePausedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          The database is paused
        </h1>
        <p className="text-muted-foreground text-lg">
          This instance of Schema Lab cannot reach its database right now. It may
          have been paused after a period of inactivity, or it is temporarily
          down. The app is unavailable until it comes back.
        </p>
        <div className="text-muted-foreground space-y-2 text-left text-sm">
          <p className="font-medium text-foreground">What you can do:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              If you know the owner of this instance, let them know so they can
              resume the database.
            </li>
            <li>
              Schema Lab is open source. Clone the repository and run it against
              your own database to get your own fully working instance.
            </li>
            <li>
              Already had the database resumed? Wait a moment and reload this
              page.
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/" />}>
            Try again
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener" />
            }
          >
            View the repository
          </Button>
        </div>
      </div>
    </main>
  );
}
