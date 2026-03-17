"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createDataset, updateDataset } from "@/lib/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SEED_PLACEHOLDER = `CREATE TABLE customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  city text
);

INSERT INTO customers (name, city) VALUES
  ('Ada', 'London'),
  ('Grace', 'New York');`;

type DatasetInput = {
  id: string;
  title: string;
  description: string | null;
  seedSql: string;
};

export function DatasetForm({ dataset }: { dataset?: DatasetInput }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(dataset);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      title: String(formData.get("title")),
      description: String(formData.get("description") ?? ""),
      seedSql: String(formData.get("seedSql")),
    };

    setIsSaving(true);
    const result = dataset
      ? await updateDataset({ id: dataset.id, ...values })
      : await createDataset(values);
    setIsSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Dataset updated" : "Dataset created");
    router.push(`/instructor/datasets/${result.datasetId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="E-commerce store"
          defaultValue={dataset?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Customers, orders and products"
          defaultValue={dataset?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seedSql">Seed SQL</Label>
        <p className="text-muted-foreground text-sm">
          Runs against a fresh Postgres database. Create tables and insert the
          sample rows students will query.
          {isEditing
            ? " Editing this re-checks every problem's solution against the new seed."
            : ""}
        </p>
        <Textarea
          id="seedSql"
          name="seedSql"
          required
          rows={16}
          spellCheck={false}
          className="font-mono text-sm"
          placeholder={SEED_PLACEHOLDER}
          defaultValue={dataset?.seedSql}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? "Validating and saving..."
            : isEditing
              ? "Save changes"
              : "Create dataset"}
        </Button>
      </div>
    </form>
  );
}
