"use server";

import { getAuthenticatedUser } from "../../lib/supabase/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const PAGE_SIZE = 1000;

type TransactionSummaryRow = {
  transaction_date: string;
  amount: number | string;
};

export async function getBalanceSummary(
  month: number,
  year: number,
): Promise<{ balance: number; previousBalance: number }> {
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
