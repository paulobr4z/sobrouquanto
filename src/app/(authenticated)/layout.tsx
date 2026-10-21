import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getAuthenticatedUser } from "../../lib/supabase/auth";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RequireAuthentication>{children}</RequireAuthentication>
    </Suspense>
  );
}

async function RequireAuthentication({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
