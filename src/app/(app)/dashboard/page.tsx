import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Hi {user.name}</h1>
        <p className="text-muted-foreground">
          Pick a problem and start writing SQL.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Practice problems</CardTitle>
            <CardDescription>
              Browse the library and solve queries against real datasets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/problems" />}>Browse problems</Button>
          </CardContent>
        </Card>

        {user.role === "INSTRUCTOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Instructor tools</CardTitle>
              <CardDescription>
                Create datasets and author new problems for your students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                render={<Link href="/instructor" />}
              >
                Open instructor panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
