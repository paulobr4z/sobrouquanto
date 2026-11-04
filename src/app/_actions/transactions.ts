"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    /^recurring:([a-zA-Z0-9-]{1,100}):(\d{4})-(\d{2})$/i.exec(transactionId);
  const isRecurringOccurrence = recurringMatch !== null;

  if (!isRecurringOccurrence && !/^[a-zA-Z0-9-]{1,100}$/.test(transactionId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (recurringMatch) {
    const occurrenceYear = Number(recurringMatch[2]);
    const month = Number(recurringMatch[3]);
    if (month < 1 || month > 12 || occurrenceYear < 1000) return null;

    const recurrenceId = recurringMatch[1];
    const occurrenceMonth = `${recurringMatch[2]}-${recurringMatch[3]}-01`;
    const start = new Date(Date.UTC(occurrenceYear, month - 1, 1));
    const end = new Date(Date.UTC(occurrenceYear, month, 1));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const { data: recurrence, error: recurrenceError } = await supabase
      .from("transaction_recurrences")
      .select(
        "id, name, category, amount, income, day_of_month, start_date, end_date, active",
      )
      .eq("id", recurrenceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (recurrenceError) {
      console.error("Failed to load transaction recurrence.", recurrenceError);
      throw new Error("Não foi possível carregar a movimentação.");
    }
    if (!recurrence) return null;

    const rule = recurrence as {
      id: string;
      name: string;
      category: string | null;
      amount: number | string;
      income: boolean;
      day_of_month: number;
      start_date: string;
      end_date: string | null;
      active: boolean;
    };
    const dayOfMonth = rule.day_of_month;
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error("Os dados de recorrência recebidos são inválidos.");
    }

    const transactionDate = new Date(
      Date.UTC(
        occurrenceYear,
        month,
        Math.min(
          dayOfMonth,
          new Date(Date.UTC(occurrenceYear, month, 0)).getUTCDate(),
        ),
      ),
    )
      .toISOString()
      .slice(0, 10);
    if (
      rule.start_date > transactionDate ||
      (rule.end_date !== null && rule.end_date < transactionDate)
    ) {
      return null;
    }

    const { data: skipped, error: skippedError } = await supabase
      .from("transaction_recurrence_skips")
      .select("recurrence_id")
      .eq("user_id", user.id)
      .eq("recurrence_id", recurrenceId)
      .eq("occurrence_month", occurrenceMonth)
      .maybeSingle();

    if (skippedError) {
      console.error("Failed to load recurrence skip.", skippedError);
      throw new Error("Não foi possível carregar a movimentação.");
    }
    if (skipped) return null;

    const { data: occurrence, error: occurrenceError } = await supabase
      .from("transactions")
      .select(
        "id, name, transaction_date, amount, income, category, created_at",
      )
      .eq("user_id", user.id)
      .eq("recurrence_id", recurrenceId)
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate)
      .maybeSingle();

    if (occurrenceError) {
      console.error("Failed to load recurrence occurrence.", occurrenceError);
      throw new Error("Não foi possível carregar a movimentação.");
    }
    if (!rule.active && !occurrence) return null;

    let recurringAmount: number | string = rule.amount;
    if (!occurrence) {
      const { data: amountChange, error: amountChangeError } = await supabase
        .from("transaction_recurrence_amount_changes")
        .select("amount")
        .eq("user_id", user.id)
        .eq("recurrence_id", recurrenceId)
        .lte("effective_month", occurrenceMonth)
        .order("effective_month", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (amountChangeError) {
        console.error(
          "Failed to load recurrence amount change.",
          amountChangeError,
        );
        throw new Error("Não foi possível carregar a movimentação.");
      }

      if (amountChange) {
        recurringAmount = amountChange.amount;
      }
    }

    const row = (occurrence ?? {
      id: transactionId,
      name: rule.name,
      transaction_date: transactionDate,
      amount: recurringAmount,
      income: rule.income,
      category: rule.category,
      created_at: null,
    }) as {
      id: number | string;
      name: string;
      transaction_date: string;
      amount: number | string;
      income: boolean;
      category: string | null;
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

    return {
      id: transactionId,
      name: row.name,
      amount: amount * (row.income ? 1 : -1),
      transactionType: row.income ? "income" : "expense",
      category: row.category?.trim() || "Sem categoria",
      transactionDate: row.transaction_date,
      createdAt: row.created_at,
      isRecurring: true,
    };
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, name, transaction_date, amount, income, category, recurrence_id, created_at",
    )
    .eq("user_id", user.id)
    .eq("id", transactionId)
    .limit(1)
    .maybeSingle();

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

  return {
    id: row.recurrence_id
      ? `recurring:${row.recurrence_id}:${row.transaction_date.slice(0, 7)}`
      : String(row.id),
    name: row.name,
    amount: amount * (row.income ? 1 : -1),
    transactionType: row.income ? "income" : "expense",
    category: row.category?.trim() || "Sem categoria",
    transactionDate: row.transaction_date,
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
  const recurrenceId = values.isRecurring ? randomUUID() : null;
  if (recurrenceId) {
    const { error: recurrenceError } = await supabase
      .from("transaction_recurrences")
      .insert({
        id: recurrenceId,
        user_id: user.id,
        name: values.name,
        category: category.name,
        icon: category.icon,
        amount: values.amount.toFixed(2),
        income: values.transactionType === "income",
        frequency: "monthly",
        day_of_month: values.dayOfMonth,
        start_date: values.transactionDate,
        active: true,
      });

    if (recurrenceError) {
      console.error(
        "Failed to create transaction recurrence.",
        recurrenceError,
      );
      return {
        status: "error",
        message: "Não foi possível salvar a recorrência. Tente novamente.",
      };
    }
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    name: values.name,
    category: category.name,
    transaction_date: values.transactionDate,
    amount: values.amount.toFixed(2),
    icon: category.icon,
    income: values.transactionType === "income",
    recurrence_id: recurrenceId,
    recurrence_frequency: values.isRecurring ? "monthly" : null,
    recurrence_day_of_month: values.isRecurring ? values.dayOfMonth : null,
    recurrence_active: values.isRecurring ? true : null,
  });

  if (error) {
    console.error("Failed to create transaction.", error);
    if (recurrenceId) {
      const { error: cleanupError } = await supabase
        .from("transaction_recurrences")
        .delete()
        .eq("id", recurrenceId)
        .eq("user_id", user.id);
      if (cleanupError) {
        console.error(
          "Failed to clean up transaction recurrence after transaction insert failed.",
          cleanupError,
        );
      }
    }
    return {
      status: "error",
      message: "Não foi possível salvar a movimentação. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  redirect(
    `/transactions?type=${values.transactionType}&created=${values.transactionType}`,
  );
}

export async function updateTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const transactionId = getStringField(formData, "transactionId");
  const recurringMatch =
    /^recurring:([a-zA-Z0-9-]{1,100}):(\d{4})-(\d{2})$/i.exec(transactionId);
  if (!recurringMatch && !/^[a-zA-Z0-9-]{1,100}$/.test(transactionId)) {
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
  if (recurringMatch) {
    const recurrenceValueScope = getStringField(
      formData,
      "recurrenceValueScope",
    );
    if (
      recurrenceValueScope !== "month" &&
      recurrenceValueScope !== "month-and-future"
    ) {
      return {
        status: "error",
        message: "Selecione como aplicar o novo valor.",
      };
    }

    const occurrenceYear = Number(recurringMatch[2]);
    const occurrenceMonth = Number(recurringMatch[3]);
    const monthPrefix = `${recurringMatch[2]}-${recurringMatch[3]}`;
    if (
      occurrenceMonth < 1 ||
      occurrenceMonth > 12 ||
      validValues.transactionDate.slice(0, 7) !== monthPrefix
    ) {
      return {
        status: "error",
        message: "A data precisa permanecer no mês desta ocorrência.",
      };
    }

    const { data: recurrence, error: recurrenceError } = await supabase
      .from("transaction_recurrences")
      .select("id, category, day_of_month, start_date, end_date, active")
      .eq("id", recurringMatch[1])
      .eq("user_id", user.id)
      .maybeSingle();

    if (recurrenceError) {
      console.error(
        "Failed to verify recurrence before saving occurrence.",
        recurrenceError,
      );
      return {
        status: "error",
        message: "Não foi possível salvar a ocorrência. Tente novamente.",
      };
    }
    if (!recurrence) {
      return {
        status: "error",
        message: "A recorrência não está mais disponível.",
      };
    }

    const startDate = `${monthPrefix}-01`;
    const nextMonthStart = new Date(
      Date.UTC(occurrenceYear, occurrenceMonth, 1),
    )
      .toISOString()
      .slice(0, 10);
    const occurrenceDate = validValues.transactionDate;
    if (
      recurrence.start_date > occurrenceDate ||
      (recurrence.end_date !== null && recurrence.end_date < occurrenceDate)
    ) {
      return {
        status: "error",
        message: "Esta recorrência não está ativa nesse período.",
      };
    }

    const { data: skipped, error: skippedError } = await supabase
      .from("transaction_recurrence_skips")
      .select("recurrence_id")
      .eq("user_id", user.id)
      .eq("recurrence_id", recurringMatch[1])
      .eq("occurrence_month", startDate)
      .maybeSingle();

    if (skippedError) {
      console.error(
        "Failed to verify skipped recurrence occurrence.",
        skippedError,
      );
      return {
        status: "error",
        message: "Não foi possível salvar a ocorrência. Tente novamente.",
      };
    }
    if (skipped) {
      return {
        status: "error",
        message: "Esta ocorrência foi ignorada e não pode ser editada.",
      };
    }

    const { data: existingOccurrence, error: occurrenceLookupError } =
      await supabase
        .from("transactions")
        .select("id, category")
        .eq("user_id", user.id)
        .eq("recurrence_id", recurringMatch[1])
        .gte("transaction_date", startDate)
        .lt("transaction_date", nextMonthStart)
        .maybeSingle();

    if (occurrenceLookupError) {
      console.error(
        "Failed to verify recurrence occurrence before saving.",
        occurrenceLookupError,
      );
      return {
        status: "error",
        message: "Não foi possível salvar a ocorrência. Tente novamente.",
      };
    }
    if (!recurrence.active && !existingOccurrence) {
      return {
        status: "error",
        message: "A recorrência não está mais ativa.",
      };
    }

    const category =
      validValues.category ??
      (validValues.categoryName === existingOccurrence?.category ||
      validValues.categoryName === recurrence.category
        ? {
            name: validValues.categoryName,
            icon: getCategoryIcon(validValues.categoryName),
          }
        : undefined);
    if (!category) {
      return { status: "error", message: "Selecione uma categoria válida." };
    }

    const occurrenceValues = {
      name: validValues.name,
      category: category.name,
      transaction_date: validValues.transactionDate,
      amount: validValues.amount.toFixed(2),
      icon: category.icon,
      income: validValues.transactionType === "income",
    };
    const saveResult = existingOccurrence
      ? await supabase
          .from("transactions")
          .update(occurrenceValues)
          .eq("id", existingOccurrence.id)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("transactions")
          .insert({
            ...occurrenceValues,
            user_id: user.id,
            recurrence_id: recurringMatch[1],
          })
          .select("id")
          .maybeSingle();

    if (saveResult.error || !saveResult.data) {
      console.error(
        "Failed to save recurring transaction occurrence.",
        saveResult.error,
      );
      return {
        status: "error",
        message: "Não foi possível salvar a ocorrência. Tente novamente.",
      };
    }

    if (recurrenceValueScope === "month-and-future") {
      const { error: amountChangeError } = await supabase
        .from("transaction_recurrence_amount_changes")
        .upsert(
          {
            recurrence_id: recurringMatch[1],
            user_id: user.id,
            effective_month: startDate,
            amount: validValues.amount.toFixed(2),
          },
          { onConflict: "recurrence_id,effective_month" },
        );

      if (amountChangeError) {
        console.error(
          "Occurrence was saved but failed to update future recurrence amounts.",
          amountChangeError,
        );
        revalidatePath("/");
        revalidatePath("/transactions");
        revalidatePath("/transactions/details");
        return {
          status: "error",
          message:
            "A ocorrência deste mês foi salva, mas não foi possível aplicar o novo valor aos próximos meses.",
        };
      }
    }

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/transactions/details");
    return {
      status: "success",
      message:
        recurrenceValueScope === "month-and-future"
          ? "Valor atualizado neste mês e nos próximos."
          : "Ocorrência salva com sucesso.",
    };
  }

  const { data: existingTransaction, error: lookupError } = await supabase
    .from("transactions")
    .select("id, recurrence_id, category")
    .eq("id", transactionId)
    .eq("user_id", user.id)
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

export async function skipRecurringOccurrence(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const recurrenceId = getStringField(formData, "recurrenceId");
  const occurrenceMonth = getStringField(formData, "occurrenceMonth");
  if (
    !/^[a-zA-Z0-9-]{1,100}$/.test(recurrenceId) ||
    !/^(\d{4})-(\d{2})-01$/.test(occurrenceMonth)
  ) {
    return { status: "error", message: "Ocorrência inválida." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para ignorar uma ocorrência.",
    };
  }

  const [yearText, monthText] = occurrenceMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (year < 1000 || month < 1 || month > 12) {
    return { status: "error", message: "Ocorrência inválida." };
  }

  const supabase = await createSupabaseActionClient();
  const { data: recurrence, error: recurrenceError } = await supabase
    .from("transaction_recurrences")
    .select("id, day_of_month, start_date, end_date")
    .eq("id", recurrenceId)
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (recurrenceError) {
    console.error(
      "Failed to verify recurrence before skipping occurrence.",
      recurrenceError,
    );
    return {
      status: "error",
      message: "Não foi possível ignorar a ocorrência. Tente novamente.",
    };
  }
  if (!recurrence) {
    return {
      status: "error",
      message: "A recorrência não está mais disponível.",
    };
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const occurrenceDate = new Date(
    Date.UTC(year, month - 1, Math.min(recurrence.day_of_month, lastDay)),
  )
    .toISOString()
    .slice(0, 10);
  if (
    recurrence.start_date > occurrenceDate ||
    (recurrence.end_date !== null && recurrence.end_date < occurrenceDate)
  ) {
    return {
      status: "error",
      message: "Esta recorrência não está ativa nesse período.",
    };
  }

  const startDate = `${yearText}-${monthText}-01`;
  const endDate = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const { data: existingOccurrence, error: occurrenceError } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("recurrence_id", recurrenceId)
    .gte("transaction_date", startDate)
    .lt("transaction_date", endDate)
    .maybeSingle();

  if (occurrenceError) {
    console.error(
      "Failed to verify recurrence occurrence before skipping.",
      occurrenceError,
    );
    return {
      status: "error",
      message: "Não foi possível ignorar a ocorrência. Tente novamente.",
    };
  }
  if (existingOccurrence) {
    return {
      status: "error",
      message: "Esta ocorrência já foi registrada e não pode ser ignorada.",
    };
  }

  const { error } = await supabase.from("transaction_recurrence_skips").upsert(
    {
      recurrence_id: recurrenceId,
      user_id: user.id,
      occurrence_month: startDate,
    },
    { onConflict: "recurrence_id,occurrence_month", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Failed to skip recurring transaction occurrence.", error);
    return {
      status: "error",
      message: "Não foi possível ignorar a ocorrência. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/details");
  return { status: "success", message: "Ocorrência ignorada." };
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

  redirect("/transactions");
}
