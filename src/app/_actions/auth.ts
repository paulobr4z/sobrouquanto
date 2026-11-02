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

export async function signUp(
  _previousState: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get("email");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof passwordConfirmation !== "string"
  ) {
    return { error: "Preencha todos os campos." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: "Informe um e-mail válido." };
  }

  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }

  if (password !== passwordConfirmation) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createSupabaseActionClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      error:
        "Não foi possível criar sua conta. Confira os dados e tente novamente.",
    };
  }

  if (data.session) {
    redirect("/");
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  redirect("/login");
}
