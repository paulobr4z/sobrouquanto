"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardDataCache } from "@/app/(authenticated)/dashboard-data-cache";
import { BalanceSummary } from "@/components/BalanceSummary";
import {
  type CategoryExpense,
  CategoryExpenseSummary,
} from "@/components/CategoryExpenseSummary";
import { INITIAL_PERIOD, type Period } from "@/components/MonthSelector";
import { SummaryMetricCard } from "@/components/SummaryMetricCard";

type MonthlyTotals = {
  income: number;
  expenses: number;
  categories: CategoryExpense[];
};

function currency(value: number): string {
  const abs = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}R$ ${abs}`;
}

export default function FinrHomeDesktop() {
  const [period, setPeriod] = useState<Period>(INITIAL_PERIOD);
  const {
    getMonthlyTotals: getCachedMonthlyTotals,
    loadMonthlyTotals: fetchMonthlyTotals,
  } = useDashboardDataCache();
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals | null>(() =>
    getCachedMonthlyTotals(period),
  );
  const [isLoadingTotals, setIsLoadingTotals] = useState(
    () => getCachedMonthlyTotals(period) === null,
  );
  const [totalsError, setTotalsError] = useState(false);
  const totalsRequestId = useRef(0);

  const loadMonthlyTotals = useCallback(async () => {
    const requestId = ++totalsRequestId.current;
    const cachedTotals = getCachedMonthlyTotals(period);
    if (cachedTotals) {
      setMonthlyTotals(cachedTotals);
      setIsLoadingTotals(false);
      setTotalsError(false);
      return;
    }

    setIsLoadingTotals(true);
    setTotalsError(false);
    setMonthlyTotals(null);

    try {
      const totals = await fetchMonthlyTotals(period);

      if (requestId === totalsRequestId.current) {
        setMonthlyTotals(totals);
      }
    } catch (error) {
      console.error("Failed to load monthly transaction totals.", error);
      if (requestId === totalsRequestId.current) {
        setTotalsError(true);
      }
    } finally {
      if (requestId === totalsRequestId.current) {
        setIsLoadingTotals(false);
      }
    }
  }, [fetchMonthlyTotals, getCachedMonthlyTotals, period]);

  useEffect(() => {
    void loadMonthlyTotals();

    return () => {
      totalsRequestId.current += 1;
    };
  }, [loadMonthlyTotals]);

  const applyPeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
  };

  return (
    <div className="mx-auto my-0 flex w-full max-w-3xl flex-col gap-8">
      <div className="min-w-0">
        <BalanceSummary period={period} onChangePeriod={applyPeriod} />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <SummaryMetricCard
            title="Entradas"
            value={
              isLoadingTotals
                ? "Carregando..."
                : totalsError || monthlyTotals === null
                  ? "Indisponível"
                  : currency(monthlyTotals.income)
            }
            icon={ArrowDownRight}
            variant="income"
          />
          <SummaryMetricCard
            title="Saídas"
            value={
              isLoadingTotals
                ? "Carregando..."
                : totalsError || monthlyTotals === null
                  ? "Indisponível"
                  : currency(monthlyTotals.expenses)
            }
            icon={ArrowUpRight}
            variant="expense"
          />
        </div>
        {totalsError && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p role="alert" className="text-xs text-rose-300">
              Não foi possível carregar entradas e saídas.
            </p>
            <button
              type="button"
              onClick={() => void loadMonthlyTotals()}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <div className="mt-8">
          <CategoryExpenseSummary
            categories={monthlyTotals?.categories ?? null}
            period={period}
            isLoading={isLoadingTotals}
            hasError={totalsError}
          />
        </div>
      </div>
    </div>
  );
}
