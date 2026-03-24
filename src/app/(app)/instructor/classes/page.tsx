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
  title: "Classes",
};

export default async function InstructorClassesPage() {
  const user = await requireInstructor();

  const classes = await prisma.classroom.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, assignments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your classes</h1>
          <p className="text-muted-foreground">
            Create a class, share the code, and assign problem sets.
          </p>
        </div>
        <Button render={<Link href="/instructor/classes/new" />}>
          New class
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No classes yet</CardTitle>
            <CardDescription>
              Create a class to give your students a code and assign practice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/instructor/classes/new" />}>
              Create a class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((classroom) => (
            <Link
              key={classroom.id}
              href={`/instructor/classes/${classroom.id}`}
            >
              <Card className="hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <CardTitle>{classroom.name}</CardTitle>
                  <CardDescription>
                    Code <span className="font-mono">{classroom.joinCode}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {classroom._count.members} student
                  {classroom._count.members === 1 ? "" : "s"} -{" "}
                  {classroom._count.assignments} assignment
                  {classroom._count.assignments === 1 ? "" : "s"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
