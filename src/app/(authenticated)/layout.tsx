import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { DashboardDataCacheProvider } from "./dashboard-data-cache";
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
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pb-8 pt-20 md:px-10 md:py-10">
            {children}
          </main>
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
