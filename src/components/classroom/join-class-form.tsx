"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { joinClassroom } from "@/lib/actions/classroom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinClassForm() {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code"));

    setIsJoining(true);
    const result = await joinClassroom({ code });
    setIsJoining(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Joined class");
    router.push(`/classes/${result.classroomId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <label htmlFor="code" className="text-sm font-medium">
          Join a class with a code
        </label>
        <Input
          id="code"
          name="code"
          placeholder="ABC123"
          autoComplete="off"
          className="font-mono uppercase"
          required
        />
      </div>
      <Button type="submit" disabled={isJoining}>
        {isJoining ? "Joining..." : "Join"}
      </Button>
    </form>
  );
}
