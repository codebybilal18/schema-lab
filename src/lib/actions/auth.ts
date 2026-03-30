"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "INSTRUCTOR"]),
});

export type SignUpResult = { ok: true } | { ok: false; error: string };

export async function signUpAction(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;

  // Reject aliases of an address that already has an account.
  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findFirst({
    where: { normalizedEmail: normalized },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "An account with this email already exists" };
  }

  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } });
    if (result?.user?.id) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role, normalizedEmail: normalized },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create account";
    return { ok: false, error: message };
  }

  return { ok: true };
}
