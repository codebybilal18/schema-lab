import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { JoinClassForm } from "@/components/classroom/join-class-form";
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

export default async function ClassesPage() {
  const user = await requireUser();

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: "desc" },
    include: {
      classroom: {
        include: {
          instructor: { select: { name: true } },
          _count: { select: { assignments: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your classes</h1>
        <p className="text-muted-foreground">
          Join a class with the code your instructor gave you.
        </p>
      </div>

      <div className="max-w-md">
        <JoinClassForm />
      </div>

      {memberships.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You have not joined any classes yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => (
            <Link
              key={membership.id}
              href={`/classes/${membership.classroom.id}`}
            >
              <Card className="hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <CardTitle>{membership.classroom.name}</CardTitle>
                  <CardDescription>
                    {membership.classroom.instructor.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {membership.classroom._count.assignments} assignment
                  {membership.classroom._count.assignments === 1 ? "" : "s"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
