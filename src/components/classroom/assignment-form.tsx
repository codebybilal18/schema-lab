"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createAssignment } from "@/lib/actions/classroom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type ProblemOption = {
  id: string;
  title: string;
  datasetTitle: string;
  difficulty: string;
};

export function AssignmentForm({
  classroomId,
  problems,
}: {
  classroomId: string;
  problems: ProblemOption[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [type, setType] = useState("PRACTICE");
  const [opensAt, setOpensAt] = useState<Date | null>(null);
  const [closesAt, setClosesAt] = useState<Date | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (selected.size === 0) {
      toast.error("Pick at least one problem");
      return;
    }

    setIsSaving(true);
    const result = await createAssignment({
      classroomId,
      title: String(formData.get("title")),
      problemIds: Array.from(selected),
      type,
      opensAt: opensAt?.toISOString() ?? "",
      closesAt: closesAt?.toISOString() ?? "",
    });
    setIsSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Assignment created");
    router.push(`/instructor/classes/${classroomId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Week 1 practice"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value) => setType(value ?? "PRACTICE")}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRACTICE">Practice - always open</SelectItem>
            <SelectItem value="QUIZ">Quiz - timed and scored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "QUIZ" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Opens at</Label>
            <DateTimePicker value={opensAt} onChange={setOpensAt} />
            <p className="text-muted-foreground text-xs">
              Leave blank to open immediately.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Closes at</Label>
            <DateTimePicker value={closesAt} onChange={setClosesAt} />
            <p className="text-muted-foreground text-xs">
              Leave blank to stay open.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Problems ({selected.size} selected)</Label>
        {problems.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You have no problems to assign yet. Create some, or use the official
            ones.
          </p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2">
            {problems.map((problem) => (
              <label
                key={problem.id}
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md p-2"
              >
                <input
                  type="checkbox"
                  className="size-4"
                  checked={selected.has(problem.id)}
                  onChange={() => toggle(problem.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {problem.title}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {problem.datasetTitle} - {problem.difficulty}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Creating..." : "Create assignment"}
        </Button>
      </div>
    </form>
  );
}
