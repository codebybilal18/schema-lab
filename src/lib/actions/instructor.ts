"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { runSeededQuery } from "@/lib/sql/sandbox";

export type DatasetActionResult =
  | { ok: true; datasetId: string }
  | { ok: false; error: string };

export type ProblemActionResult =
  | { ok: true; problemId: string }
  | { ok: false; error: string };

const datasetSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional(),
  seedSql: z.string().trim().min(1, "Seed SQL is required").max(100_000),
});

const problemSchema = z.object({
  datasetId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  prompt: z.string().trim().min(1, "Prompt is required").max(5000),
  solutionQuery: z
    .string()
    .trim()
    .min(1, "Solution query is required")
    .max(10_000),
  orderMatters: z.boolean(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function createDataset(input: {
  title: string;
  description?: string;
  seedSql: string;
}): Promise<DatasetActionResult> {
  const user = await requireInstructor();

  const parsed = datasetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const { title, description, seedSql } = parsed.data;

  // Make sure the seed SQL actually runs before we save it.
  const probe = await runSeededQuery(seedSql, "SELECT 1", { timeoutMs: 8000 });
  if (!probe.ok) {
    return { ok: false, error: `The seed SQL failed to run: ${probe.error}` };
  }

  const dataset = await prisma.dataset.create({
    data: {
      title,
      description: description || null,
      seedSql,
      authorId: user.id,
    },
  });

  revalidatePath("/instructor");
  return { ok: true, datasetId: dataset.id };
}

export async function createProblem(input: {
  datasetId: string;
  title: string;
  prompt: string;
  solutionQuery: string;
  orderMatters: boolean;
  difficulty: string;
}): Promise<ProblemActionResult> {
  const user = await requireInstructor();

  const parsed = problemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const data = parsed.data;

  const dataset = await prisma.dataset.findUnique({
    where: { id: data.datasetId },
  });
  if (!dataset || dataset.authorId !== user.id) {
    return { ok: false, error: "Dataset not found" };
  }

  // Run the solution against the dataset to validate it and cache the result.
  const run = await runSeededQuery(dataset.seedSql, data.solutionQuery, {
    timeoutMs: 8000,
  });
  if (!run.ok) {
    return { ok: false, error: `The solution query failed: ${run.error}` };
  }

  const expectedResult = JSON.parse(JSON.stringify(run.result));

  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      prompt: data.prompt,
      solutionQuery: data.solutionQuery,
      orderMatters: data.orderMatters,
      difficulty: data.difficulty,
      expectedResult,
      datasetId: dataset.id,
      authorId: user.id,
    },
  });

  revalidatePath(`/instructor/datasets/${dataset.id}`);
  return { ok: true, problemId: problem.id };
}
