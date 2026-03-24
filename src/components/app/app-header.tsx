import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

type AppHeaderProps = {
  name: string;
  role: string;
};

export function AppHeader({ name, role }: AppHeaderProps) {
  const isInstructor = role === "INSTRUCTOR";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Schema Lab
          </Link>
          <Link
            href="/problems"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Problems
          </Link>
          <Link
            href={isInstructor ? "/instructor/classes" : "/classes"}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Classes
          </Link>
          {isInstructor && (
            <Link
              href="/instructor"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Instructor
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground hidden text-sm sm:inline"
          >
            {name}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
