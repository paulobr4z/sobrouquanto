"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { categories } from "@/data/categories";
import { parseBrazilianAmount } from "@/lib/currency";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export type TransactionFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

function getStringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getTransactionDay(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const parsedDate = new Date(0);
  parsedDate.setUTCFullYear(year, month - 1, day);

  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return day;
}

export async function createTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const name = getStringField(formData, "description");
  const categoryName = getStringField(formData, "category");
  const transactionDate = getStringField(formData, "date");
  const amountInput = getStringField(formData, "amount");
  const transactionType = getStringField(formData, "transactionType");
  const isRecurring = formData.get("isRecurring") === "on";
  const category = categories.find(({ name }) => name === categoryName);
  const dayOfMonth = getTransactionDay(transactionDate);
  const amount = parseBrazilianAmount(amountInput);

  if (!name) {
    return { status: "error", message: "Informe uma descrição." };
  }

  if (!category) {
    return { status: "error", message: "Selecione uma categoria válida." };
  }

  if (dayOfMonth === null) {
    return { status: "error", message: "Informe uma data válida." };
  }

  if (amount === null || amount <= 0) {
    return { status: "error", message: "Informe um valor maior que zero." };
  }

  if (transactionType !== "income" && transactionType !== "expense") {
    return { status: "error", message: "Selecione o tipo da movimentação." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para salvar uma movimentação.",
    };
  }

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    name,
    category: category.name,
    transaction_date: transactionDate,
    amount: amount.toFixed(2),
    icon: category.icon,
    income: transactionType === "income",
    recurrence_id: isRecurring ? randomUUID() : null,
    recurrence_frequency: isRecurring ? "monthly" : null,
    recurrence_day_of_month: isRecurring ? dayOfMonth : null,
    recurrence_active: isRecurring ? true : null,
  });

  if (error) {
    console.error("Failed to create transaction.", error);
    return {
      status: "error",
      message: "Não foi possível salvar a movimentação. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  return {
    status: "success",
    message: "Movimentação salva com sucesso.",
  };
}
