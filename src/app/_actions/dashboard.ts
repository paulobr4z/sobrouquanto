"use server";

import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const PAGE_SIZE = 1000;

type TransactionSummaryRow = {
  id: number | string;
  name: string;
  transaction_date: string;
  amount: number | string;
  income: boolean;
  category?: string | null;
  recurrence_id?: string | null;
  recurrence_frequency?: string | null;
  recurrence_day_of_month?: number | null;
  recurrence_active?: boolean | null;
};

export type MonthlyTransaction = {
  id: string;
  name: string;
  transactionDate: string;
  amount: number;
  category: string;
  isRecurring: boolean;
};

type MonthlyCategoryExpense = {
  category: string;
  amount: number;
  previousAmount: number;
};

function validatePeriod(month: number, year: number) {
  if (
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11 ||
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999
  ) {
    throw new Error("O período selecionado é inválido.");
  }
}

function getSignedAmount(row: TransactionSummaryRow): number {
  const amount = Number(row.amount);

  if (
    !Number.isFinite(amount) ||
    amount === 0 ||
    typeof row.income !== "boolean"
  ) {
    throw new Error("Os dados de uma movimentação recebida são inválidos.");
  }

  return Math.abs(amount) * (row.income ? 1 : -1);
}

function getMonthlyOccurrenceDate(
  year: number,
  month: number,
  dayOfMonth: number,
): string {
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDayOfMonth);

  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

async function getActiveMonthlyRecurrences(
  userId: string,
  beforeDate: string,
): Promise<TransactionSummaryRow[]> {
  const supabase = await createSupabaseServerClient();
  const recurringTransactions = new Map<string, TransactionSummaryRow>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, name, transaction_date, amount, income, category, recurrence_id, recurrence_day_of_month",
      )
      .eq("user_id", userId)
      .eq("recurrence_active", true)
      .eq("recurrence_frequency", "monthly")
      .lt("transaction_date", beforeDate)
      .order("transaction_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionSummaryRow[];

    for (const row of rows) {
      const recurrenceDay = row.recurrence_day_of_month;
      if (
        typeof row.recurrence_id !== "string" ||
        !row.recurrence_id ||
        typeof recurrenceDay !== "number" ||
        !Number.isInteger(recurrenceDay) ||
        recurrenceDay < 1 ||
        recurrenceDay > 31
      ) {
        throw new Error(
          "Os dados de recorrência de uma movimentação recebida são inválidos.",
        );
      }

      if (!recurringTransactions.has(row.recurrence_id)) {
        recurringTransactions.set(row.recurrence_id, row);
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  return Array.from(recurringTransactions.values());
}

export async function getMonthlyTransactions(
  month: number,
  year: number,
): Promise<MonthlyTransaction[]> {
  validatePeriod(month, year);

  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Entre na sua conta para acessar suas movimentações.");
  }

  const currentStart = new Date(Date.UTC(year, month, 1));
  const nextStart = new Date(Date.UTC(year, month + 1, 1));
  const monthPrefix = currentStart.toISOString().slice(0, 7);
  const supabase = await createSupabaseServerClient();
  const transactions: MonthlyTransaction[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, name, transaction_date, amount, income, category, recurrence_id, recurrence_frequency, recurrence_day_of_month, recurrence_active",
      )
      .eq("user_id", user.id)
      .gte("transaction_date", currentStart.toISOString().slice(0, 10))
      .lt("transaction_date", nextStart.toISOString().slice(0, 10))
      .order("transaction_date", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionSummaryRow[];

    for (const row of rows) {
      const amount = getSignedAmount(row);

      if (row.transaction_date.slice(0, 7) !== monthPrefix) {
        throw new Error(
          "O Supabase retornou uma movimentação fora do período.",
        );
      }

      transactions.push({
        id: String(row.id),
        name: row.name,
        transactionDate: row.transaction_date,
        amount,
        category:
          typeof row.category === "string" && row.category.trim()
            ? row.category.trim()
            : "Sem categoria",
        isRecurring: Boolean(row.recurrence_id),
      });
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  const recurringTransactions = await getActiveMonthlyRecurrences(
    user.id,
    nextStart.toISOString().slice(0, 10),
  );

  for (const row of recurringTransactions) {
    const amount = getSignedAmount(row);
    const recurrenceDay = row.recurrence_day_of_month;
    if (typeof recurrenceDay !== "number") {
      throw new Error(
        "Os dados de recorrência de uma movimentação recebida são inválidos.",
      );
    }
    const transactionDate =
      row.transaction_date.slice(0, 7) === monthPrefix
        ? row.transaction_date
        : getMonthlyOccurrenceDate(year, month, recurrenceDay);

    if (row.transaction_date.slice(0, 7) === monthPrefix) {
      const sourceIndex = transactions.findIndex(
        (transaction) => transaction.id === String(row.id),
      );
      if (sourceIndex !== -1) {
        transactions.splice(sourceIndex, 1);
      }
    }

    transactions.push({
      id: `recurring:${row.recurrence_id}:${monthPrefix}`,
      name: row.name,
      transactionDate,
      amount,
      category:
        typeof row.category === "string" && row.category.trim()
          ? row.category.trim()
          : "Sem categoria",
      isRecurring: true,
    });
  }

  transactions.sort((first, second) =>
    second.transactionDate.localeCompare(first.transactionDate),
  );

  return transactions;
}

export async function getMonthlyTotals(
  month: number,
  year: number,
): Promise<{
  income: number;
  expenses: number;
  categories: MonthlyCategoryExpense[];
}> {
  validatePeriod(month, year);

  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Entre na sua conta para acessar o resumo financeiro.");
  }

  const currentStart = new Date(Date.UTC(year, month, 1));
  const previousStart = new Date(Date.UTC(year, month - 1, 1));
  const nextStart = new Date(Date.UTC(year, month + 1, 1));
  const previousMonthPrefix = previousStart.toISOString().slice(0, 7);
  const monthPrefix = currentStart.toISOString().slice(0, 7);
  const supabase = await createSupabaseServerClient();
  const totals = { income: 0, expenses: 0 };
  const categoryTotals = new Map<string, number>();
  const previousCategoryTotals = new Map<string, number>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, transaction_date, amount, income, category")
      .eq("user_id", user.id)
      .gte("transaction_date", previousStart.toISOString().slice(0, 10))
      .lt("transaction_date", nextStart.toISOString().slice(0, 10))
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionSummaryRow[];

    for (const row of rows) {
      const amount = getSignedAmount(row);
      const rowMonth = row.transaction_date.slice(0, 7);

      if (rowMonth !== monthPrefix && rowMonth !== previousMonthPrefix) {
        throw new Error(
          "O Supabase retornou uma movimentação fora do período.",
        );
      }

      if (row.income) {
        if (rowMonth === monthPrefix) {
          totals.income += Math.abs(amount);
        }
      } else {
        const categoryTotalsForMonth =
          rowMonth === monthPrefix ? categoryTotals : previousCategoryTotals;
        if (rowMonth === monthPrefix) {
          totals.expenses -= Math.abs(amount);
        }
        const category =
          typeof row.category === "string" && row.category.trim()
            ? row.category.trim()
            : "Sem categoria";
        categoryTotalsForMonth.set(
          category,
          (categoryTotalsForMonth.get(category) ?? 0) + Math.abs(amount),
        );
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  const recurringTransactions = await getActiveMonthlyRecurrences(
    user.id,
    nextStart.toISOString().slice(0, 10),
  );

  for (const row of recurringTransactions) {
    const sourceMonth = row.transaction_date.slice(0, 7);
    if (sourceMonth === monthPrefix) {
      continue;
    }

    const amount = getSignedAmount(row);
    if (row.income) {
      totals.income += Math.abs(amount);
      continue;
    }

    const expense = Math.abs(amount);
    const category =
      typeof row.category === "string" && row.category.trim()
        ? row.category.trim()
        : "Sem categoria";
    totals.expenses -= expense;
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + expense);
    if (sourceMonth !== previousMonthPrefix) {
      previousCategoryTotals.set(
        category,
        (previousCategoryTotals.get(category) ?? 0) + expense,
      );
    }
  }

  return {
    ...totals,
    categories: Array.from(categoryTotals, ([category, amount]) => ({
      category,
      amount,
      previousAmount: previousCategoryTotals.get(category) ?? 0,
    })).sort((first, second) => second.amount - first.amount),
  };
}

export async function getBalanceSummary(
  month: number,
  year: number,
): Promise<{ balance: number; previousBalance: number }> {
  validatePeriod(month, year);

  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Entre na sua conta para acessar o resumo financeiro.");
  }

  const currentStart = new Date(Date.UTC(year, month, 1));
  const previousStart = new Date(Date.UTC(year, month - 1, 1));
  const nextStart = new Date(Date.UTC(year, month + 1, 1));
  const previousMonthPrefix = previousStart.toISOString().slice(0, 7);
  const currentMonthPrefix = currentStart.toISOString().slice(0, 7);
  const supabase = await createSupabaseServerClient();
  const totals = { current: 0, previous: 0 };

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, transaction_date, amount, income")
      .eq("user_id", user.id)
      .gte("transaction_date", previousStart.toISOString().slice(0, 10))
      .lt("transaction_date", nextStart.toISOString().slice(0, 10))
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionSummaryRow[];

    for (const row of rows) {
      const amount = getSignedAmount(row);

      if (row.transaction_date.slice(0, 7) === currentMonthPrefix) {
        totals.current += amount;
      } else if (row.transaction_date.slice(0, 7) === previousMonthPrefix) {
        totals.previous += amount;
      } else {
        throw new Error(
          "O Supabase retornou uma movimentação fora do período.",
        );
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  const recurringTransactions = await getActiveMonthlyRecurrences(
    user.id,
    nextStart.toISOString().slice(0, 10),
  );

  for (const row of recurringTransactions) {
    const amount = getSignedAmount(row);
    const transactionMonth = row.transaction_date.slice(0, 7);

    if (transactionMonth < previousMonthPrefix) {
      totals.previous += amount;
      totals.current += amount;
    } else if (transactionMonth === previousMonthPrefix) {
      totals.current += amount;
    }
  }

  return {
    balance: totals.current,
    previousBalance: totals.previous,
  };
}
