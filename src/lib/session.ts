import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getSession() {
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
