"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "../../lib/supabase/server";

export async function signIn(
  _previousState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Informe seu e-mail e sua senha." };
  }

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Não foi possível entrar. Confira o e-mail e a senha." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  redirect("/login");
}
