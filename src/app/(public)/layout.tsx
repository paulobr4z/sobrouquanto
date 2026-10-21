import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { getAuthenticatedUser } from "../../lib/supabase/auth";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RedirectAuthenticatedUser>{children}</RedirectAuthenticatedUser>
    </Suspense>
  );
}

async function RedirectAuthenticatedUser({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/");
  }

  return children;
}
