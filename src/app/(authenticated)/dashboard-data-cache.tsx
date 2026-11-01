"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import { getBalanceSummary, getMonthlyTotals } from "@/app/_actions/dashboard";
import type { Period } from "@/components/MonthSelector";

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
      invalidate: () => {
        monthlyTotalsCache.current.generation += 1;
        monthlyTotalsCache.current.values.clear();
        monthlyTotalsCache.current.requests.clear();
        balanceSummaryCache.current.generation += 1;
        balanceSummaryCache.current.values.clear();
        balanceSummaryCache.current.requests.clear();
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
