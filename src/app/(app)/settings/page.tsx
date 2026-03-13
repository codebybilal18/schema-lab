import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { RoleSwitcher } from "@/components/settings/role-switcher";
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
        <CardContent>
          <RoleSwitcher role={user.role} />
        </CardContent>
      </Card>
    </div>
  );
}
