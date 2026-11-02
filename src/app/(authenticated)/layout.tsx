import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { DashboardDataCacheProvider } from "./dashboard-data-cache";
import MobileNavigation from "./mobile-navigation";
import Sidebar from "./sidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RequireAuthentication>
        <div
          style={{ fontFamily: "'Urbanist', sans-serif" }}
          className="flex min-h-screen bg-neutral-950"
        >
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap"
          />
          <header className="fixed left-0 top-0 z-80 flex min-h-16 w-full items-center border-b border-neutral-800 bg-neutral-950 px-4">
            <span className="text-lg font-bold leading-tight text-neutral-50">
              Sobrou Quanto?
            </span>
            <Link
              href="/transactions/new"
              aria-label="Lançar movimentação"
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-0 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 active:scale-[0.98] md:w-auto md:px-4"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden md:inline">Lançar</span>
            </Link>
          </header>
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pb-24 pt-20 md:px-10 md:py-20">
            {children}
          </main>
          <MobileNavigation />
        </div>
      </RequireAuthentication>
    </Suspense>
  );
}

async function RequireAuthentication({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardDataCacheProvider key={user.id}>
      {children}
    </DashboardDataCacheProvider>
  );
}
