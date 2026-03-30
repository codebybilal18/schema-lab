"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { signUpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLES = [
  {
    value: "STUDENT",
    title: "Student",
    description: "Solve problems and practice SQL",
  },
  {
    value: "INSTRUCTOR",
    title: "Instructor",
    description: "Create datasets and author problems",
  },
] as const;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<string>("STUDENT");
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    setIsLoading(true);
    const result = await signUpAction({ name, email, password, role });
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSentToEmail(email);
  }

  if (sentToEmail) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to {sentToEmail}. Open it to activate
            your account, then sign in.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" render={<Link href="/sign-in" />}>
            Go to sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start solving SQL problems in minutes</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
            />
          </div>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>I am joining as</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(String(value))}>
              {ROLES.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`role-${option.value}`}
                  className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary"
                >
                  <RadioGroupItem
                    id={`role-${option.value}`}
                    value={option.value}
                    className="mt-0.5"
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">
                      {option.title}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {option.description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
