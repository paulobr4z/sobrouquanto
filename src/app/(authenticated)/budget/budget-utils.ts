export type SpendingBudget = {
  amount: number;
  startDate: string;
  cycleAnchorDate: string;
  spent: number;
  weeklySpent: number;
  weeklyStartDate: string;
};

export type SpendingPace = "within" | "attention" | "exceeded";

export type SpendingBudgetMetrics = {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  periodProgress: number;
  budgetConsumed: number;
  balance: number;
  expectedSpent: number;
  dailyAverage: number;
  recommendedPerDay: number;
  dailyDifference: number;
  dailyReference: number;
  weekStart: Date;
  weekEnd: Date;
  weekSpent: number;
  weekReference: number;
  weekDifference: number;
  weekNumber: number;
  pace: SpendingPace;
  projectedTotal: number;
  daysUntilBudgetRunsOut: number | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function addMonthsClamped(date: Date, months: number): Date {
  const targetMonth = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();

  return new Date(
    Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay), 12),
  );
}

function getActiveCycleDates(anchorDate: Date, today: Date) {
  let monthOffset =
    (today.getUTCFullYear() - anchorDate.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    anchorDate.getUTCMonth();

  if (monthOffset < 0) {
    return {
      startDate: anchorDate,
      nextStartDate: addMonthsClamped(anchorDate, 1),
    };
  }

  let cycleStart = addMonthsClamped(anchorDate, monthOffset);
  if (cycleStart > today) {
    monthOffset -= 1;
    cycleStart = addMonthsClamped(anchorDate, Math.max(0, monthOffset));
  }

  return {
    startDate: cycleStart,
    nextStartDate: addMonthsClamped(anchorDate, Math.max(0, monthOffset) + 1),
  };
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_IN_MS);
}

export function getTodayIsoDate(): string {
  const today = new Date();
  return toIsoDate(
    new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12),
    ),
  );
}

export function parseBrazilianAmount(value: string): number | null {
  const rawValue = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");
  const normalized = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function formatBrazilianAmountInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";

  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAmountForInput(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calculateSpendingMetrics(
  budget: SpendingBudget,
  today = getTodayIsoDate(),
): SpendingBudgetMetrics {
  const anchorDate = fromIsoDate(budget.cycleAnchorDate);
  const todayDate = fromIsoDate(today);
  const { startDate, nextStartDate } = getActiveCycleDates(
    anchorDate,
    todayDate,
  );
  const nextCycleStart = nextStartDate;
  const endDate = addDays(nextCycleStart, -1);
  const totalDays = daysBetween(startDate, endDate) + 1;
  const daysSinceStart = daysBetween(startDate, todayDate);
  const elapsedDays = Math.min(totalDays, Math.max(0, daysSinceStart + 1));
  const remainingDays = totalDays - elapsedDays;
  const balance = budget.amount - budget.spent;
  const expectedSpent = (budget.amount * elapsedDays) / totalDays;
  const dailyReference = budget.amount / totalDays;
  const dailyAverage = elapsedDays > 0 ? budget.spent / elapsedDays : 0;
  const recommendedPerDay =
    remainingDays > 0 ? Math.max(0, balance / remainingDays) : 0;
  const budgetConsumed = (budget.spent / budget.amount) * 100;
  const periodProgress = (elapsedDays / totalDays) * 100;
  const pace: SpendingPace =
    budget.spent >= budget.amount
      ? "exceeded"
      : budgetConsumed > periodProgress
        ? "attention"
        : "within";
  const weekNumber = Math.max(0, Math.floor(Math.max(0, elapsedDays - 1) / 7));
  const weekStart = addDays(startDate, weekNumber * 7);
  const weekEnd = new Date(
    Math.min(addDays(weekStart, 6).getTime(), endDate.getTime()),
  );
  const weekDays = daysBetween(weekStart, weekEnd) + 1;
  const weekSpent =
    budget.weeklyStartDate === toIsoDate(weekStart) ? budget.weeklySpent : 0;
  const weekReference = (budget.amount * weekDays) / totalDays;
  const projectedTotal = dailyAverage * totalDays;
  const daysUntilBudgetRunsOut =
    dailyAverage > 0 ? Math.ceil(Math.max(0, balance) / dailyAverage) : null;

  return {
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    periodProgress,
    budgetConsumed,
    balance,
    expectedSpent,
    dailyAverage,
    recommendedPerDay,
    dailyDifference: expectedSpent - budget.spent,
    dailyReference,
    weekStart,
    weekEnd,
    weekSpent,
    weekReference,
    weekDifference: weekReference - weekSpent,
    weekNumber: weekNumber + 1,
    pace,
    projectedTotal,
    daysUntilBudgetRunsOut,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDateRange(start: Date, end: Date): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function formatPaceLabel(pace: SpendingPace): string {
  if (pace === "exceeded") return "Orçamento excedido";
  if (pace === "attention") return "Acima do ritmo";
  return "Dentro do ritmo";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isSpendingBudget(value: unknown): value is SpendingBudget {
  if (typeof value !== "object" || value === null) return false;
  const budget = value as Record<string, unknown>;

  return (
    typeof budget.amount === "number" &&
    Number.isFinite(budget.amount) &&
    budget.amount > 0 &&
    isIsoDate(budget.startDate) &&
    isIsoDate(budget.cycleAnchorDate) &&
    typeof budget.spent === "number" &&
    Number.isFinite(budget.spent) &&
    budget.spent >= 0 &&
    typeof budget.weeklySpent === "number" &&
    Number.isFinite(budget.weeklySpent) &&
    budget.weeklySpent >= 0 &&
    isIsoDate(budget.weeklyStartDate)
  );
}
