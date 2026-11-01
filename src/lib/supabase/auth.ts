import "server-only";

import { connection } from "next/server";
import { isInvalidSessionError } from "./auth-errors";
import { createSupabaseServerClient } from "./server";

export async function getAuthenticatedUser() {
  await connection();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error &&
    error.name !== "AuthSessionMissingError" &&
    !isInvalidSessionError(error)
  ) {
    throw error;
  }

  return user;
}
