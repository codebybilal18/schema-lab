import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ensureDatabaseAvailable } from "@/lib/db-health";

export async function getSession() {
  // Gate every session-backed page and server action: if the database is
  // unreachable, redirect to the paused page instead of surfacing raw errors.
  await ensureDatabaseAvailable();

  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session.user;
}

export async function requireInstructor() {
  const user = await requireUser();

  if (user.role !== "INSTRUCTOR") {
    redirect("/dashboard");
  }

  return user;
}
