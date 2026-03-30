"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { signIn, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    setUnverifiedEmail(null);
    setIsLoading(true);
    const { error } = await signIn.email({ email, password });
    setIsLoading(false);

    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email);
        toast.error("Please verify your email before signing in");
        return;
      }
      toast.error(error.message ?? "Could not sign in");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    const { error } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
    });
    if (error) {
      toast.error(error.message ?? "Could not resend the email");
      return;
    }
    toast.success("Verification email sent");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to continue practicing SQL</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          {unverifiedEmail && (
            <p className="text-muted-foreground text-sm">
              Didn&apos;t get the email?{" "}
              <button
                type="button"
                onClick={resendVerification}
                className="text-foreground underline"
              >
                Resend verification
              </button>
            </p>
          )}
          <div className="flex w-full items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
            <Link href="/sign-up" className="text-foreground underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
