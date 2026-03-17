"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProblem, updateProblem } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProblemInput = {
  id: string;
  title: string;
  prompt: string;
  solutionQuery: string;
  orderMatters: boolean;
  difficulty: string;
};

export function ProblemForm({
  datasetId,
  problem,
}: {
  datasetId: string;
  problem?: ProblemInput;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [difficulty, setDifficulty] = useState(problem?.difficulty ?? "EASY");
  const [orderMatters, setOrderMatters] = useState(
    problem?.orderMatters ?? false,
  );
  const isEditing = Boolean(problem);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      title: String(formData.get("title")),
      prompt: String(formData.get("prompt")),
      solutionQuery: String(formData.get("solutionQuery")),
      orderMatters,
      difficulty,
    };

    setIsSaving(true);
    const result = problem
      ? await updateProblem({ id: problem.id, ...values })
      : await createProblem({ datasetId, ...values });
    setIsSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Problem updated" : "Problem created");
    router.push(`/instructor/datasets/${datasetId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Top customers by spend"
          defaultValue={problem?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <p className="text-muted-foreground text-sm">
          Describe the task. Markdown is supported.
        </p>
        <Textarea
          id="prompt"
          name="prompt"
          rows={5}
          required
          placeholder="Find the 3 customers who spent the most, highest first."
          defaultValue={problem?.prompt}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="solutionQuery">Solution query</Label>
        <p className="text-muted-foreground text-sm">
          The correct query. We run it against the dataset to build the answer
          key. Students never see it.
        </p>
        <Textarea
          id="solutionQuery"
          name="solutionQuery"
          rows={8}
          required
          spellCheck={false}
          className="font-mono text-sm"
          placeholder="SELECT name, spend FROM customers ORDER BY spend DESC LIMIT 3;"
          defaultValue={problem?.solutionQuery}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value ?? "EASY")}
          >
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderMatters">Row order</Label>
          <label className="flex items-center gap-2 text-sm">
            <input
              id="orderMatters"
              type="checkbox"
              checked={orderMatters}
              onChange={(event) => setOrderMatters(event.target.checked)}
              className="size-4"
            />
            Require rows in the exact order (for ORDER BY problems)
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? "Validating and saving..."
            : isEditing
              ? "Save changes"
              : "Create problem"}
        </Button>
      </div>
    </form>
  );
}
