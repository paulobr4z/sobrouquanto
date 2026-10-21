import "server-only";

import { connection } from "next/server";
import { createSupabaseServerClient } from "./server";

export async function getAuthenticatedUser() {
  await connection();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw error;
  }

  return user;
}
