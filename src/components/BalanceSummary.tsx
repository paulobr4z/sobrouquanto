"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardDataCache } from "@/app/(authenticated)/dashboard-data-cache";
import { MonthSelector, type Period } from "@/components/MonthSelector";

type BalanceSummaryProps = {
  period: Period;
  onChangePeriod: (period: Period) => void;
};

type BalanceSummaryData = {
  balance: number;
  previousBalance: number;
};

export function BalanceSummary({
  period,
  onChangePeriod,
}: BalanceSummaryProps) {
  const {
    getBalanceSummary: getCachedBalanceSummary,
    loadBalanceSummary: fetchBalanceSummary,
  } = useDashboardDataCache();
  const [summary, setSummary] = useState<BalanceSummaryData | null>(() =>
    getCachedBalanceSummary(period),
  );
  const [isLoading, setIsLoading] = useState(
    () => getCachedBalanceSummary(period) === null,
  );
  const [loadError, setLoadError] = useState(false);
  const requestIdRef = useRef(0);

  const loadSummary = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const cachedSummary = getCachedBalanceSummary(period);
    if (cachedSummary) {
      setSummary(cachedSummary);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    setSummary(null);

    try {
      const data = await fetchBalanceSummary(period);

      if (requestId === requestIdRef.current) {
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to load balance summary.", error);
      if (requestId === requestIdRef.current) {
        setLoadError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchBalanceSummary, getCachedBalanceSummary, period]);

  useEffect(() => {
    void loadSummary();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadSummary]);

  const percentageChange =
    summary === null
      ? null
      : summary.previousBalance === 0
        ? summary.balance === 0
          ? 0
          : null
        : ((summary.balance - summary.previousBalance) /
            Math.abs(summary.previousBalance)) *
          100;
  const percentageLabel =
    percentageChange === null
      ? "Novo saldo"
      : `${percentageChange > 0 ? "+" : ""}${percentageChange.toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          },
        )}%`;
  const percentageColor =
    percentageChange === null
      ? (summary?.balance ?? 0) < 0
        ? "text-rose-400"
        : "text-emerald-400"
      : percentageChange > 0
        ? "text-emerald-400"
        : percentageChange < 0
          ? "text-rose-400"
          : "text-neutral-400";
  const balanceLabel = isLoading
    ? "Carregando..."
    : loadError || summary === null
      ? "Indisponível"
      : summary.balance.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

  return (
    <section
      aria-label="Resumo do saldo"
      aria-busy={isLoading}
      className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-xl font-normal text-neutral-50 sm:text-2xl">Saldo</p>
        <MonthSelector period={period} onChangePeriod={onChangePeriod} />
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
          {balanceLabel}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`text-sm font-semibold ${percentageColor}`}>
            {isLoading || loadError ? "—" : percentageLabel}
          </span>
          <span className="text-sm text-neutral-500">vs mês passado</span>
        </div>
        {loadError && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p role="alert" className="text-xs text-rose-300">
              Não foi possível carregar o resumo.
            </p>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
