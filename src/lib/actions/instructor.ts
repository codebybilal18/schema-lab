"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/session";
import { runSeededQuery } from "@/lib/sql/sandbox";
import { introspectSchema } from "@/lib/sql/schema";

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

const updateDatasetSchema = datasetSchema.extend({ id: z.string().min(1) });
const updateProblemSchema = problemSchema
  .omit({ datasetId: true })
  .extend({ id: z.string().min(1) });

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
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

  // Run the seed SQL to validate it and capture the table/column structure.
  const introspection = await introspectSchema(seedSql);
  if (!introspection.ok) {
    return { ok: false, error: `The seed SQL failed to run: ${introspection.error}` };
  }

  const dataset = await prisma.dataset.create({
    data: {
      title,
      description: description || null,
      seedSql,
      schemaInfo: introspection.schema,
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

  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      prompt: data.prompt,
      solutionQuery: data.solutionQuery,
      orderMatters: data.orderMatters,
      difficulty: data.difficulty,
      expectedResult: toJson(run.result),
      datasetId: dataset.id,
      authorId: user.id,
    },
  });

  revalidatePath(`/instructor/datasets/${dataset.id}`);
  return { ok: true, problemId: problem.id };
}

export async function updateDataset(input: {
  id: string;
  title: string;
  description?: string;
  seedSql: string;
}): Promise<DatasetActionResult> {
  const user = await requireInstructor();

  const parsed = updateDatasetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const { id, title, description, seedSql } = parsed.data;

  const existing = await prisma.dataset.findUnique({
    where: { id },
    include: { problems: true },
  });
  if (!existing || existing.authorId !== user.id) {
    return { ok: false, error: "Dataset not found" };
  }

  const introspection = await introspectSchema(seedSql);
  if (!introspection.ok) {
    return { ok: false, error: `The seed SQL failed to run: ${introspection.error}` };
  }

  // The seed changed, so every problem's cached answer key must be recomputed.
  // If any solution no longer runs, reject the edit so nothing goes stale.
  const problemUpdates = [];
  for (const problem of existing.problems) {
    const run = await runSeededQuery(seedSql, problem.solutionQuery, {
      timeoutMs: 8000,
    });
    if (!run.ok) {
      return {
        ok: false,
        error: `Problem "${problem.title}" no longer runs against this seed: ${run.error}`,
      };
    }
    problemUpdates.push(
      prisma.problem.update({
        where: { id: problem.id },
        data: { expectedResult: toJson(run.result) },
      }),
    );
  }

  await prisma.$transaction([
    prisma.dataset.update({
      where: { id },
      data: {
        title,
        description: description || null,
        seedSql,
        schemaInfo: introspection.schema,
      },
    }),
    ...problemUpdates,
  ]);

  revalidatePath("/instructor");
  revalidatePath(`/instructor/datasets/${id}`);
  return { ok: true, datasetId: id };
}

export async function deleteDataset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireInstructor();

  const existing = await prisma.dataset.findUnique({ where: { id } });
  if (!existing || existing.authorId !== user.id) {
    return { ok: false, error: "Dataset not found" };
  }

  await prisma.dataset.delete({ where: { id } });

  revalidatePath("/instructor");
  return { ok: true };
}

export async function updateProblem(input: {
  id: string;
  title: string;
  prompt: string;
  solutionQuery: string;
  orderMatters: boolean;
  difficulty: string;
}): Promise<ProblemActionResult> {
  const user = await requireInstructor();

  const parsed = updateProblemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const data = parsed.data;

  const existing = await prisma.problem.findUnique({
    where: { id: data.id },
    include: { dataset: { select: { seedSql: true } } },
  });
  if (!existing || existing.authorId !== user.id) {
    return { ok: false, error: "Problem not found" };
  }

  const run = await runSeededQuery(existing.dataset.seedSql, data.solutionQuery, {
    timeoutMs: 8000,
  });
  if (!run.ok) {
    return { ok: false, error: `The solution query failed: ${run.error}` };
  }

  await prisma.problem.update({
    where: { id: data.id },
    data: {
      title: data.title,
      prompt: data.prompt,
      solutionQuery: data.solutionQuery,
      orderMatters: data.orderMatters,
      difficulty: data.difficulty,
      expectedResult: toJson(run.result),
    },
  });

  revalidatePath(`/instructor/datasets/${existing.datasetId}`);
  return { ok: true, problemId: data.id };
}

export async function deleteProblem(
  id: string,
): Promise<{ ok: true; datasetId: string } | { ok: false; error: string }> {
  const user = await requireInstructor();

  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing || existing.authorId !== user.id) {
    return { ok: false, error: "Problem not found" };
  }

  await prisma.problem.delete({ where: { id } });

  revalidatePath(`/instructor/datasets/${existing.datasetId}`);
  return { ok: true, datasetId: existing.datasetId };
}
