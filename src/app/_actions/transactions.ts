"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { categories, getCategoryIcon } from "@/data/categories";
import { parseBrazilianAmount } from "@/lib/currency";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import {
  createSupabaseActionClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type TransactionFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type TransactionDetails = {
  id: string;
  name: string;
  amount: number;
  transactionType: "income" | "expense";
  category: string;
  transactionDate: string;
  createdAt: string | null;
  isRecurring: boolean;
};

type TransactionFormValues = {
  name: string;
  categoryName: string;
  transactionDate: string;
  transactionType: string;
  isRecurring: boolean;
  category: (typeof categories)[number] | undefined;
  dayOfMonth: number | null;
  amount: number | null;
};

type ValidTransactionFormValues = Omit<
  TransactionFormValues,
  "dayOfMonth" | "amount" | "transactionType"
> & {
  dayOfMonth: number;
  amount: number;
  transactionType: "income" | "expense";
};

type TransactionValidation =
  | { success: true; values: ValidTransactionFormValues }
  | { success: false; state: TransactionFormState };

function getStringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getTransactionFormValues(formData: FormData): TransactionFormValues {
  const name = getStringField(formData, "description");
  const categoryName = getStringField(formData, "category");
  const transactionDate = getStringField(formData, "date");
  const transactionType = getStringField(formData, "transactionType");

  return {
    name,
    categoryName,
    transactionDate,
    transactionType,
    isRecurring: formData.get("isRecurring") === "on",
    category: categories.find(({ name }) => name === categoryName),
    dayOfMonth: getTransactionDay(transactionDate),
    amount: parseBrazilianAmount(getStringField(formData, "amount")),
  };
}

function validateTransactionFormValues(
  values: TransactionFormValues,
): TransactionValidation {
  if (!values.name) {
    return {
      success: false,
      state: { status: "error", message: "Informe uma descrição." },
    };
  }

  if (values.dayOfMonth === null) {
    return {
      success: false,
      state: { status: "error", message: "Informe uma data válida." },
    };
  }

  if (values.amount === null || values.amount <= 0) {
    return {
      success: false,
      state: { status: "error", message: "Informe um valor maior que zero." },
    };
  }

  if (
    values.transactionType !== "income" &&
    values.transactionType !== "expense"
  ) {
    return {
      success: false,
      state: {
        status: "error",
        message: "Selecione o tipo da movimentação.",
      },
    };
  }

  return {
    success: true,
    values: {
      ...values,
      dayOfMonth: values.dayOfMonth,
      amount: values.amount,
      transactionType: values.transactionType,
    },
  };
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

export async function getTransactionDetails(
  transactionId: string,
): Promise<TransactionDetails | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Entre na sua conta para acessar suas movimentações.");
  }

  const recurringMatch =
    /^recurring:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d{4})-(\d{2})$/i.exec(
      transactionId,
    );
  const isRecurringOccurrence = recurringMatch !== null;

  if (!isRecurringOccurrence && !/^[a-zA-Z0-9-]{1,100}$/.test(transactionId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, name, transaction_date, amount, income, category, recurrence_id, recurrence_active, recurrence_day_of_month, created_at",
    )
    .eq("user_id", user.id);

  if (recurringMatch) {
    const month = Number(recurringMatch[3]);
    if (month < 1 || month > 12) return null;

    query = query
      .eq("recurrence_id", recurringMatch[1])
      .eq("recurrence_active", true);
  } else {
    query = query.eq("id", transactionId);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error("Failed to load transaction details.", error);
    throw new Error("Não foi possível carregar a movimentação.");
  }
  if (!data) return null;

  const row = data as {
    id: number | string;
    name: string;
    transaction_date: string;
    amount: number | string;
    income: boolean;
    category: string | null;
    recurrence_id: string | null;
    recurrence_active: boolean | null;
    recurrence_day_of_month: number | null;
    created_at: string | null;
  };
  const amount = Number(row.amount);
  if (
    !Number.isFinite(amount) ||
    amount === 0 ||
    typeof row.income !== "boolean" ||
    typeof row.name !== "string"
  ) {
    throw new Error("Os dados da movimentação recebida são inválidos.");
  }

  let transactionDate = row.transaction_date;
  if (recurringMatch) {
    const occurrenceYear = Number(recurringMatch[2]);
    const occurrenceMonth = Number(recurringMatch[3]) - 1;
    const dayOfMonth = row.recurrence_day_of_month;
    if (
      typeof dayOfMonth !== "number" ||
      !Number.isInteger(dayOfMonth) ||
      dayOfMonth < 1 ||
      dayOfMonth > 31
    ) {
      throw new Error("Os dados de recorrência recebidos são inválidos.");
    }

    const lastDay = new Date(
      Date.UTC(occurrenceYear, occurrenceMonth + 1, 0),
    ).getUTCDate();
    transactionDate = new Date(
      Date.UTC(occurrenceYear, occurrenceMonth, Math.min(dayOfMonth, lastDay)),
    )
      .toISOString()
      .slice(0, 10);
  }

  return {
    id: String(row.id),
    name: row.name,
    amount: amount * (row.income ? 1 : -1),
    transactionType: row.income ? "income" : "expense",
    category: row.category?.trim() || "Sem categoria",
    transactionDate,
    createdAt: row.created_at,
    isRecurring: Boolean(row.recurrence_id),
  };
}

export async function createTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const formValues = getTransactionFormValues(formData);
  if (!formValues.name) {
    return { status: "error", message: "Informe uma descrição." };
  }
  const category = formValues.category;
  if (!category) {
    return { status: "error", message: "Selecione uma categoria válida." };
  }

  const validation = validateTransactionFormValues(formValues);
  if (!validation.success) return validation.state;
  const { values } = validation;

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
    name: values.name,
    category: category.name,
    transaction_date: values.transactionDate,
    amount: values.amount.toFixed(2),
    icon: category.icon,
    income: values.transactionType === "income",
    recurrence_id: values.isRecurring ? randomUUID() : null,
    recurrence_frequency: values.isRecurring ? "monthly" : null,
    recurrence_day_of_month: values.isRecurring ? values.dayOfMonth : null,
    recurrence_active: values.isRecurring ? true : null,
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

export async function updateTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const transactionId = getStringField(formData, "transactionId");
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(transactionId)) {
    return { status: "error", message: "Movimentação inválida." };
  }

  const values = getTransactionFormValues(formData);
  const validation = validateTransactionFormValues(values);
  if (!validation.success) return validation.state;
  const validValues = validation.values;

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para editar uma movimentação.",
    };
  }

  const supabase = await createSupabaseActionClient();
  const { data: existingTransaction, error: lookupError } = await supabase
    .from("transactions")
    .select("id, recurrence_id, category")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .is("recurrence_id", null)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to verify transaction before updating.", lookupError);
    return {
      status: "error",
      message: "Não foi possível editar a movimentação. Tente novamente.",
    };
  }
  if (!existingTransaction) {
    return {
      status: "error",
      message: "Movimentação não encontrada ou indisponível para edição.",
    };
  }

  const category =
    validValues.category ??
    (existingTransaction.category === validValues.categoryName
      ? {
          name: validValues.categoryName,
          icon: getCategoryIcon(validValues.categoryName),
        }
      : undefined);
  if (!category) {
    return { status: "error", message: "Selecione uma categoria válida." };
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      name: validValues.name,
      category: category.name,
      transaction_date: validValues.transactionDate,
      amount: validValues.amount.toFixed(2),
      icon: category.icon,
      income: validValues.transactionType === "income",
    })
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .is("recurrence_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update transaction.", error);
    return {
      status: "error",
      message: "Não foi possível salvar as alterações. Tente novamente.",
    };
  }
  if (!data) {
    return {
      status: "error",
      message: "Movimentação não encontrada ou indisponível para edição.",
    };
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/details");

  return { status: "success", message: "Movimentação atualizada com sucesso." };
}

export async function deleteTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const transactionId = getStringField(formData, "transactionId");
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(transactionId)) {
    return { status: "error", message: "Movimentação inválida." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para excluir uma movimentação.",
    };
  }

  const supabase = await createSupabaseActionClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .is("recurrence_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete transaction.", error);
    return {
      status: "error",
      message: "Não foi possível excluir a movimentação. Tente novamente.",
    };
  }
  if (!data) {
    return {
      status: "error",
      message: "Movimentação não encontrada ou indisponível para exclusão.",
    };
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/details");

  return { status: "success", message: "Movimentação excluída com sucesso." };
}
