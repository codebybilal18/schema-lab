"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage,
  redirectTo,
  label = "Delete",
  size = "sm",
}: {
  action: () => Promise<{ ok: true } | { ok: false; error: string }>;
  confirmMessage: string;
  redirectTo?: string;
  label?: string;
  size?: "sm" | "xs";
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function onClick() {
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    const result = await action();

    if (!result.ok) {
      setIsDeleting(false);
      toast.error(result.error);
      return;
    }

    toast.success("Deleted");
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <Button
      variant="destructive"
      size={size}
      onClick={onClick}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : label}
    </Button>
  );
}
