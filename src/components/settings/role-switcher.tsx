"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserRole } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

export function RoleSwitcher({ role }: { role: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const isInstructor = role === "INSTRUCTOR";
  const nextRole = isInstructor ? "STUDENT" : "INSTRUCTOR";

  async function switchRole() {
    setIsSaving(true);
    try {
      await updateUserRole(nextRole);
      toast.success(
        nextRole === "INSTRUCTOR"
          ? "You are now an instructor"
          : "You are now a student",
      );
      router.refresh();
    } catch {
      toast.error("Could not update your role");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm">
        You are currently a{" "}
        <span className="font-medium">
          {isInstructor ? "instructor" : "student"}
        </span>
        .
      </p>
      <Button variant="outline" onClick={switchRole} disabled={isSaving}>
        {isSaving
          ? "Updating..."
          : isInstructor
            ? "Switch to student"
            : "Become an instructor"}
      </Button>
    </div>
  );
}
