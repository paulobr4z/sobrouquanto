"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export type ProfileNameState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveProfileName(
  _previousState: ProfileNameState,
  formData: FormData,
): Promise<ProfileNameState> {
  const rawDisplayName = formData.get("displayName");

  if (typeof rawDisplayName !== "string") {
    return { status: "error", message: "Informe seu nome." };
  }

  const displayName = rawDisplayName.trim();

  if (!displayName) {
    return { status: "error", message: "Informe seu nome." };
  }

  if (displayName.length > 100) {
    return {
      status: "error",
      message: "O nome deve ter no máximo 100 caracteres.",
    };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para atualizar seu perfil.",
    };
  }

  const supabase = await createSupabaseActionClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to save profile name.", error);
    if (error.code === "42501") {
      return {
        status: "error",
        message:
          "O Supabase bloqueou a atualização. Verifique a política RLS de UPDATE da tabela profiles para o próprio usuário.",
      };
    }

    return {
      status: "error",
      message: "Não foi possível salvar seu nome. Tente novamente.",
    };
  }

  if (!data) {
    return {
      status: "error",
      message:
        "O perfil não foi atualizado. Verifique se a política RLS permite UPDATE quando o id corresponde ao usuário autenticado.",
    };
  }

  revalidatePath("/profile");

  return { status: "success", message: "Nome atualizado com sucesso." };
}
