"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import { loadSpendingBudget as fetchSpendingBudget } from "@/app/_actions/budget";
import type { MonthlyTransaction } from "@/app/_actions/dashboard";
import {
  getMonthlyTransactions as fetchMonthlyTransactions,
  getBalanceSummary,
  getMonthlyTotals,
} from "@/app/_actions/dashboard";
import type { Period } from "@/components/MonthSelector";
import type { SpendingBudget } from "./budget/budget-utils";

type MonthlyTotals = Awaited<ReturnType<typeof getMonthlyTotals>>;
type BalanceSummary = Awaited<ReturnType<typeof getBalanceSummary>>;

type Cache<T> = {
  values: Map<string, T>;
  requests: Map<string, Promise<T>>;
  generation: number;
};

type DashboardCache = {
  getMonthlyTotals: (period: Period) => MonthlyTotals | null;
  loadMonthlyTotals: (period: Period) => Promise<MonthlyTotals>;
  getBalanceSummary: (period: Period) => BalanceSummary | null;
  loadBalanceSummary: (period: Period) => Promise<BalanceSummary>;
  getMonthlyTransactions: (period: Period) => MonthlyTransaction[] | null;
  loadMonthlyTransactions: (period: Period) => Promise<MonthlyTransaction[]>;
  getSpendingBudget: () => SpendingBudget | null | undefined;
  loadSpendingBudget: () => Promise<SpendingBudget | null>;
  setSpendingBudget: (budget: SpendingBudget | null) => void;
  invalidate: () => void;
};

const DashboardDataCacheContext = createContext<DashboardCache | null>(null);

function periodKey({ month, year }: Period) {
  return `${year}-${month}`;
}

function loadCached<T>(
  cache: Cache<T>,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  const cachedValue = cache.values.get(key);
  if (cachedValue !== undefined) {
    return Promise.resolve(cachedValue);
  }

  const pendingRequest = cache.requests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }

  const generation = cache.generation;
  const request = load().then(
    (value) => {
      if (generation === cache.generation) {
        cache.values.set(key, value);
        cache.requests.delete(key);
      }
      return value;
    },
    (error: unknown) => {
      if (generation === cache.generation) {
        cache.requests.delete(key);
      }
      throw error;
    },
  );

  cache.requests.set(key, request);
  return request;
}

export function DashboardDataCacheProvider({
  children,
}: {
  children: ReactNode;
}) {
  const monthlyTotalsCache = useRef<Cache<MonthlyTotals>>({
    values: new Map(),
    requests: new Map(),
    generation: 0,
  });
  const balanceSummaryCache = useRef<Cache<BalanceSummary>>({
    values: new Map(),
    requests: new Map(),
    generation: 0,
  });
  const monthlyTransactionsCache = useRef<Cache<MonthlyTransaction[]>>({
    values: new Map(),
    requests: new Map(),
    generation: 0,
  });
  const spendingBudgetCache = useRef<Cache<SpendingBudget | null>>({
    values: new Map(),
    requests: new Map(),
    generation: 0,
  });

  const cache = useMemo<DashboardCache>(
    () => ({
      getMonthlyTotals: (period) =>
        monthlyTotalsCache.current.values.get(periodKey(period)) ?? null,
      loadMonthlyTotals: (period) =>
        loadCached(monthlyTotalsCache.current, periodKey(period), () =>
          getMonthlyTotals(period.month, period.year),
        ),
      getBalanceSummary: (period) =>
        balanceSummaryCache.current.values.get(periodKey(period)) ?? null,
      loadBalanceSummary: (period) =>
        loadCached(balanceSummaryCache.current, periodKey(period), () =>
          getBalanceSummary(period.month, period.year),
        ),
      getMonthlyTransactions: (period) =>
        monthlyTransactionsCache.current.values.get(periodKey(period)) ?? null,
      loadMonthlyTransactions: (period) =>
        loadCached(monthlyTransactionsCache.current, periodKey(period), () =>
          fetchMonthlyTransactions(period.month, period.year),
        ),
      getSpendingBudget: () =>
        spendingBudgetCache.current.values.get("current"),
      loadSpendingBudget: () =>
        loadCached(spendingBudgetCache.current, "current", fetchSpendingBudget),
      setSpendingBudget: (budget) => {
        spendingBudgetCache.current.generation += 1;
        spendingBudgetCache.current.requests.clear();
        spendingBudgetCache.current.values.set("current", budget);
      },
      invalidate: () => {
        monthlyTotalsCache.current.generation += 1;
        monthlyTotalsCache.current.values.clear();
        monthlyTotalsCache.current.requests.clear();
        balanceSummaryCache.current.generation += 1;
        balanceSummaryCache.current.values.clear();
        balanceSummaryCache.current.requests.clear();
        monthlyTransactionsCache.current.generation += 1;
        monthlyTransactionsCache.current.values.clear();
        monthlyTransactionsCache.current.requests.clear();
        spendingBudgetCache.current.generation += 1;
        spendingBudgetCache.current.values.clear();
        spendingBudgetCache.current.requests.clear();
      },
    }),
    [],
  );

  return (
    <DashboardDataCacheContext.Provider value={cache}>
      {children}
    </DashboardDataCacheContext.Provider>
  );
}

export function useDashboardDataCache() {
  const cache = useContext(DashboardDataCacheContext);
  if (!cache) {
    throw new Error(
      "useDashboardDataCache must be used within DashboardDataCacheProvider.",
    );
  }

  return cache;
}
