"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const VALID_ROLES = ["STUDENT", "INSTRUCTOR"] as const;
type Role = (typeof VALID_ROLES)[number];

function isRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export async function updateUserRole(role: string) {
  const user = await requireUser();

  if (!isRole(role)) {
    throw new Error("Invalid role");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  revalidatePath("/", "layout");
}
