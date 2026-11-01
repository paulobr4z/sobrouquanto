import { isAuthApiError } from "@supabase/supabase-js";

const invalidSessionErrorCodes = new Set([
  "bad_jwt",
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_expired",
  "session_not_found",
]);

export function isInvalidSessionError(error: unknown): boolean {
  return (
    isAuthApiError(error) &&
    typeof error.code === "string" &&
    invalidSessionErrorCodes.has(error.code)
  );
}
