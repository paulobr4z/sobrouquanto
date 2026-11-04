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
};

type TransactionRecurrenceRule = {
  id: string;
  name: string;
  amount: number | string;
  income: boolean;
  category: string | null;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
};

type TransactionRecurrenceAmountChange = {
  recurrence_id: string;
  amount: number | string;
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
): Promise<TransactionRecurrenceRule[]> {
  const supabase = await createSupabaseServerClient();
  const recurringRules: TransactionRecurrenceRule[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transaction_recurrences")
      .select(
        "id, name, amount, income, category, day_of_month, start_date, end_date",
      )
      .eq("user_id", userId)
      .eq("active", true)
      .eq("frequency", "monthly")
      .lt("start_date", beforeDate)
      .order("start_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionRecurrenceRule[];

    for (const row of rows) {
      if (
        typeof row.id !== "string" ||
        !row.id ||
        typeof row.day_of_month !== "number" ||
        !Number.isInteger(row.day_of_month) ||
        row.day_of_month < 1 ||
        row.day_of_month > 31 ||
        typeof row.start_date !== "string"
      ) {
        throw new Error(
          "Os dados de recorrência de uma movimentação recebida são inválidos.",
        );
      }

      recurringRules.push(row);
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  return recurringRules;
}

async function getRecurrenceIdsForMonth(
  userId: string,
  monthStart: string,
  nextMonthStart: string,
  source: "transactions" | "transaction_recurrence_skips",
): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const recurrenceIds = new Set<string>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query =
      source === "transactions"
        ? supabase
            .from("transactions")
            .select("recurrence_id")
            .eq("user_id", userId)
            .gte("transaction_date", monthStart)
            .lt("transaction_date", nextMonthStart)
            .not("recurrence_id", "is", null)
        : supabase
            .from("transaction_recurrence_skips")
            .select("recurrence_id")
            .eq("user_id", userId)
            .eq("occurrence_month", monthStart);
    const { data, error } = await query
      .order("recurrence_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    for (const row of data as { recurrence_id: string }[]) {
      recurrenceIds.add(row.recurrence_id);
    }

    if (data.length < PAGE_SIZE) break;
  }

  return recurrenceIds;
}

async function getRecurrenceAmountChangesForMonth(
  userId: string,
  monthStart: string,
  recurrenceIds: string[],
): Promise<Map<string, number>> {
  const supabase = await createSupabaseServerClient();
  const amountChanges = new Map<string, number>();
  if (recurrenceIds.length === 0) return amountChanges;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transaction_recurrence_amount_changes")
      .select("recurrence_id, amount")
      .eq("user_id", userId)
      .in("recurrence_id", recurrenceIds)
      .lte("effective_month", monthStart)
      .order("recurrence_id", { ascending: true })
      .order("effective_month", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    for (const row of data as TransactionRecurrenceAmountChange[]) {
      const amount = Number(row.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          "Os valores de alteração da recorrência recebidos são inválidos.",
        );
      }

      amountChanges.set(row.recurrence_id, amount);
    }

    if (data.length < PAGE_SIZE) break;
  }

  return amountChanges;
}

async function getMonthlyRecurrenceProjections(
  userId: string,
  month: number,
  year: number,
): Promise<MonthlyTransaction[]> {
  const currentStart = new Date(Date.UTC(year, month, 1));
  const nextStart = new Date(Date.UTC(year, month + 1, 1));
  const monthPrefix = currentStart.toISOString().slice(0, 7);
  const monthStart = currentStart.toISOString().slice(0, 10);
  const nextMonthStart = nextStart.toISOString().slice(0, 10);
  const recurrenceRules = await getActiveMonthlyRecurrences(
    userId,
    nextMonthStart,
  );
  const [existingRecurrenceIds, skippedRecurrenceIds, amountChanges] =
    await Promise.all([
      getRecurrenceIdsForMonth(
        userId,
        monthStart,
        nextMonthStart,
        "transactions",
      ),
      getRecurrenceIdsForMonth(
        userId,
        monthStart,
        nextMonthStart,
        "transaction_recurrence_skips",
      ),
      getRecurrenceAmountChangesForMonth(
        userId,
        monthStart,
        recurrenceRules.map((rule) => rule.id),
      ),
    ]);

  return recurrenceRules.flatMap((rule) => {
    const transactionDate = getMonthlyOccurrenceDate(
      year,
      month,
      rule.day_of_month,
    );
    if (
      rule.start_date > transactionDate ||
      (rule.end_date !== null && rule.end_date < transactionDate) ||
      existingRecurrenceIds.has(rule.id) ||
      skippedRecurrenceIds.has(rule.id)
    ) {
      return [];
    }

    const amount = amountChanges.get(rule.id) ?? Number(rule.amount);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof rule.income !== "boolean"
    ) {
      throw new Error("Os dados de recorrência recebidos são inválidos.");
    }

    return [
      {
        id: `recurring:${rule.id}:${monthPrefix}`,
        name: rule.name,
        transactionDate,
        amount: Math.abs(amount) * (rule.income ? 1 : -1),
        category:
          typeof rule.category === "string" && rule.category.trim()
            ? rule.category.trim()
            : "Sem categoria",
        isRecurring: true,
      },
    ];
  });
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
        "id, name, transaction_date, amount, income, category, recurrence_id",
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

  transactions.push(
    ...(await getMonthlyRecurrenceProjections(user.id, month, year)),
  );

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

  const [currentProjections, previousProjections] = await Promise.all([
    getMonthlyRecurrenceProjections(user.id, month, year),
    getMonthlyRecurrenceProjections(
      user.id,
      previousStart.getUTCMonth(),
      previousStart.getUTCFullYear(),
    ),
  ]);

  for (const transaction of currentProjections) {
    if (transaction.amount > 0) {
      totals.income += transaction.amount;
    } else {
      const expense = Math.abs(transaction.amount);
      totals.expenses -= expense;
      categoryTotals.set(
        transaction.category,
        (categoryTotals.get(transaction.category) ?? 0) + expense,
      );
    }
  }

  for (const transaction of previousProjections) {
    if (transaction.amount < 0) {
      const category = transaction.category;
      previousCategoryTotals.set(
        category,
        (previousCategoryTotals.get(category) ?? 0) +
          Math.abs(transaction.amount),
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
): Promise<{
  balance: number;
  previousBalance: number;
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

  const [currentProjections, previousProjections] = await Promise.all([
    getMonthlyRecurrenceProjections(user.id, month, year),
    getMonthlyRecurrenceProjections(
      user.id,
      previousStart.getUTCMonth(),
      previousStart.getUTCFullYear(),
    ),
  ]);

  for (const transaction of previousProjections) {
    totals.previous += transaction.amount;
    totals.current += transaction.amount;
  }

  for (const transaction of currentProjections) {
    totals.current += transaction.amount;
  }

  return {
    balance: totals.current,
    previousBalance: totals.previous,
  };
}
