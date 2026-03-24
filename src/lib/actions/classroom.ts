"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireInstructor, requireUser } from "@/lib/session";

// Ambiguous characters (I, L, O, 0, 1) are left out of join codes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

const classroomSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
});

const assignmentSchema = z.object({
  classroomId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  problemIds: z.array(z.string().min(1)).min(1, "Pick at least one problem"),
});

export type ClassroomActionResult =
  | { ok: true; classroomId: string }
  | { ok: false; error: string };

export type AssignmentActionResult =
  | { ok: true; assignmentId: string }
  | { ok: false; error: string };

export async function createClassroom(input: {
  name: string;
  description?: string;
}): Promise<ClassroomActionResult> {
  const user = await requireInstructor();

  const parsed = classroomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  let joinCode = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateJoinCode();
    const existing = await prisma.classroom.findUnique({
      where: { joinCode: candidate },
    });
    if (!existing) {
      joinCode = candidate;
      break;
    }
  }
  if (!joinCode) {
    return { ok: false, error: "Could not generate a join code, please retry" };
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      joinCode,
      instructorId: user.id,
    },
  });

  revalidatePath("/instructor/classes");
  return { ok: true, classroomId: classroom.id };
}

export async function deleteClassroom(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireInstructor();

  const existing = await prisma.classroom.findUnique({ where: { id } });
  if (!existing || existing.instructorId !== user.id) {
    return { ok: false, error: "Class not found" };
  }

  await prisma.classroom.delete({ where: { id } });

  revalidatePath("/instructor/classes");
  return { ok: true };
}

export async function joinClassroom(input: {
  code: string;
}): Promise<{ ok: true; classroomId: string } | { ok: false; error: string }> {
  const user = await requireUser();

  const code = input.code.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Enter a join code" };
  }

  const classroom = await prisma.classroom.findUnique({
    where: { joinCode: code },
  });
  if (!classroom) {
    return { ok: false, error: "No class found with that code" };
  }
  if (classroom.instructorId === user.id) {
    return { ok: false, error: "You are the instructor of this class" };
  }

  await prisma.classroomMember.upsert({
    where: {
      classroomId_userId: { classroomId: classroom.id, userId: user.id },
    },
    create: { classroomId: classroom.id, userId: user.id },
    update: {},
  });

  revalidatePath("/classes");
  return { ok: true, classroomId: classroom.id };
}

export async function createAssignment(input: {
  classroomId: string;
  title: string;
  problemIds: string[];
}): Promise<AssignmentActionResult> {
  const user = await requireInstructor();

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: parsed.data.classroomId },
  });
  if (!classroom || classroom.instructorId !== user.id) {
    return { ok: false, error: "Class not found" };
  }

  // Only official problems and the instructor's own problems can be assigned.
  const problems = await prisma.problem.findMany({
    where: {
      id: { in: parsed.data.problemIds },
      OR: [{ authorId: null }, { authorId: user.id }],
    },
    select: { id: true },
  });
  const validIds = new Set(problems.map((problem) => problem.id));
  const chosen = parsed.data.problemIds.filter((id) => validIds.has(id));
  if (chosen.length === 0) {
    return { ok: false, error: "None of the selected problems are available" };
  }

  const assignment = await prisma.assignment.create({
    data: {
      title: parsed.data.title,
      classroomId: classroom.id,
      problems: {
        create: chosen.map((problemId, index) => ({
          problemId,
          position: index,
        })),
      },
    },
  });

  revalidatePath(`/instructor/classes/${classroom.id}`);
  return { ok: true, assignmentId: assignment.id };
}

export async function deleteAssignment(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireInstructor();

  const existing = await prisma.assignment.findUnique({
    where: { id },
    include: { classroom: { select: { instructorId: true } } },
  });
  if (!existing || existing.classroom.instructorId !== user.id) {
    return { ok: false, error: "Assignment not found" };
  }

  await prisma.assignment.delete({ where: { id } });

  revalidatePath(`/instructor/classes/${existing.classroomId}`);
  return { ok: true };
}
