import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {user.name} - {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          You are signed in as {user.role === "INSTRUCTOR" ? "an" : "a"}{" "}
          {user.role === "INSTRUCTOR" ? "instructor" : "student"}.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password. This signs you out of other devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
