"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is invalid or has expired");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message ?? "Could not reset your password");
      return;
    }

    toast.success("Password updated. Please sign in.");
    router.push("/sign-in");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      {token ? (
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <PasswordInput
                id="confirm"
                name="confirm"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <CardFooter className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            This reset link is invalid or has expired.
          </p>
          <Button className="w-full" render={<Link href="/forgot-password" />}>
            Request a new link
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
