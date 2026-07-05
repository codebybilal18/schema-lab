import { AppHeader } from "@/components/app/app-header";
import { requireUser } from "@/lib/session";

// Running SQL boots an ephemeral PGlite (Postgres wasm) instance per query. A
// cold start can take several seconds, so allow more than the platform default
// for the pages and server actions under this segment.
export const maxDuration = 30;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name} role={user.role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
