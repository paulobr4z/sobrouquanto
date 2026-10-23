"use server";

import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const PAGE_SIZE = 1000;

type TransactionSummaryRow = {
  id: string;
  transaction_date: string;
  amount: number | string;
  category?: string | null;
};

export type MonthlyTransaction = {
  id: string;
  transactionDate: string;
  amount: number;
  category: string;
};

type MonthlyCategoryExpense = {
  category: string;
  amount: number;
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
      .select("id, transaction_date, amount, category")
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
      const amount = Number(row.amount);

      if (!Number.isFinite(amount) || amount === 0) {
        throw new Error("Os dados de uma movimentação recebida são inválidos.");
      }

      if (row.transaction_date.slice(0, 7) !== monthPrefix) {
        throw new Error(
          "O Supabase retornou uma movimentação fora do período.",
        );
      }

      transactions.push({
        id: row.id,
        transactionDate: row.transaction_date,
        amount,
        category:
          typeof row.category === "string" && row.category.trim()
            ? row.category.trim()
            : "Sem categoria",
      });
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

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
  const nextStart = new Date(Date.UTC(year, month + 1, 1));
  const monthPrefix = currentStart.toISOString().slice(0, 7);
  const supabase = await createSupabaseServerClient();
  const totals = { income: 0, expenses: 0 };
  const categoryTotals = new Map<string, number>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, transaction_date, amount, category")
      .eq("user_id", user.id)
      .gte("transaction_date", currentStart.toISOString().slice(0, 10))
      .lt("transaction_date", nextStart.toISOString().slice(0, 10))
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const rows = data as TransactionSummaryRow[];

    for (const row of rows) {
      const amount = Number(row.amount);

      if (!Number.isFinite(amount) || amount === 0) {
        throw new Error("Os dados de uma movimentação recebida são inválidos.");
      }

      if (row.transaction_date.slice(0, 7) !== monthPrefix) {
        throw new Error(
          "O Supabase retornou uma movimentação fora do período.",
        );
      }

      if (amount > 0) {
        totals.income += amount;
      } else {
        totals.expenses += amount;
        const category =
          typeof row.category === "string" && row.category.trim()
            ? row.category.trim()
            : "Sem categoria";
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + Math.abs(amount),
        );
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  return {
    ...totals,
    categories: Array.from(categoryTotals, ([category, amount]) => ({
      category,
      amount,
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
      .select("id, transaction_date, amount")
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
      const amount = Number(row.amount);

      if (!Number.isFinite(amount) || amount === 0) {
        throw new Error("Os dados de uma movimentação recebida são inválidos.");
      }

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

  return {
    balance: totals.current,
    previousBalance: totals.previous,
  };
}
