"use server";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import {
  calculateSpendingMetrics,
  isSpendingBudget,
  type SpendingBudget,
} from "../(authenticated)/budget/budget-utils";

type SpendingBudgetRow = {
  amount: number | string;
  start_date: string;
  cycle_anchor_date: string;
  spent: number | string;
  weekly_spent: number | string;
  weekly_start_date: string;
};

function mapSpendingBudgetRow(row: SpendingBudgetRow): SpendingBudget {
  const budget: SpendingBudget = {
    amount: Number(row.amount),
    startDate: row.start_date,
    cycleAnchorDate: row.cycle_anchor_date,
    spent: Number(row.spent),
    weeklySpent: Number(row.weekly_spent),
    weeklyStartDate: row.weekly_start_date,
  };

  if (!isSpendingBudget(budget)) {
    throw new Error("Os dados do orçamento recebidos são inválidos.");
  }

  return budget;
}

async function saveBudgetForUser(userId: string, budget: SpendingBudget) {
  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.from("spending_budgets").upsert(
    {
      user_id: userId,
      amount: budget.amount,
      start_date: budget.startDate,
      cycle_anchor_date: budget.cycleAnchorDate,
      spent: budget.spent,
      weekly_spent: budget.weeklySpent,
      weekly_start_date: budget.weeklyStartDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

export async function loadSpendingBudget(): Promise<SpendingBudget | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Entre na sua conta para acessar o orçamento.");
  }

  const supabase = await createSupabaseActionClient();
  const { data, error } = await supabase
    .from("spending_budgets")
    .select(
      "amount, start_date, cycle_anchor_date, spent, weekly_spent, weekly_start_date",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const budget = mapSpendingBudgetRow(data);
  const metrics = calculateSpendingMetrics(budget);
  const activeStartDate = metrics.startDate.toISOString().slice(0, 10);
  const activeWeekStart = metrics.weekStart.toISOString().slice(0, 10);

  if (budget.startDate !== activeStartDate) {
    const updatedBudget: SpendingBudget = {
      ...budget,
      startDate: activeStartDate,
      spent: 0,
      weeklySpent: 0,
      weeklyStartDate: activeWeekStart,
    };
    await saveBudgetForUser(user.id, updatedBudget);
    return updatedBudget;
  }

  return budget;
}

export async function saveSpendingBudget(
  budget: SpendingBudget,
): Promise<void> {
  if (!isSpendingBudget(budget)) {
    throw new Error("Os dados do orçamento são inválidos.");
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Entre na sua conta para acessar o orçamento.");
  }

  await saveBudgetForUser(user.id, budget);
}

export async function deleteSpendingBudget(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Entre na sua conta para acessar o orçamento.");
  }

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase
    .from("spending_budgets")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
