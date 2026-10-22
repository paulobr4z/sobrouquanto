"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Car,
  Coffee,
  type LucideIcon,
  ShoppingCart,
  Trash2,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardDataCache } from "@/app/(authenticated)/dashboard-data-cache";
import { BalanceSummary } from "@/components/BalanceSummary";
import {
  type CategoryExpense,
  CategoryExpenseSummary,
} from "@/components/CategoryExpenseSummary";
import { INITIAL_PERIOD, type Period } from "@/components/MonthSelector";
import { SummaryMetricCard } from "@/components/SummaryMetricCard";

type Transaction = {
  id: number;
  name: string;
  category: string;
  day: string;
  amount: number;
  icon: LucideIcon;
  time: string;
  income?: boolean;
  date: string;
};

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

function getDataForPeriod({ month, year }: Period) {
  const seed = month + 1 + (year - 2026) * 12;
  const monthCode = String(month + 1).padStart(2, "0");

  const transactions: Transaction[] = [
    {
      id: 1,
      name: "Almoço",
      category: "Lazer",
      day: "05",
      amount: -(60 + (seed % 5) * 8),
      icon: Coffee,
      time: "13:42",
    },
    {
      id: 2,
      name: "Salário",
      category: "Salário",
      day: "05",
      amount: 10000,
      icon: Briefcase,
      time: "08:10",
      income: true,
    },
    {
      id: 3,
      name: "Supermercado",
      category: "Mercado",
      day: "04",
      amount: -(320 + (seed % 4) * 25),
      icon: ShoppingCart,
      time: "18:20",
    },
    {
      id: 4,
      name: "Uber",
      category: "Transporte",
      day: "03",
      amount: -(24 + (seed % 3) * 6),
      icon: Car,
      time: "22:05",
    },
    {
      id: 5,
      name: "Internet",
      category: "Assinaturas",
      day: "02",
      amount: -99.9,
      icon: Wifi,
      time: "09:00",
    },
  ].map((transaction) => ({
    ...transaction,
    date: `${transaction.day}/${monthCode}/${year}`,
  }));

  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return { transactions, income, expenses };
}

export default function FinrHomeDesktop() {
  const [period, setPeriod] = useState<Period>(INITIAL_PERIOD);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const { transactions } = getDataForPeriod(period);
  const selectedTx =
    transactions.find((transaction) => transaction.id === selectedId) ?? null;

  const applyPeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    setSelectedId(null);
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
      {confirmDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <button
            type="button"
            aria-label="Fechar confirmação de exclusão"
            onClick={() => setConfirmDelete(false)}
            className="absolute inset-0 cursor-default bg-black/80"
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15">
                <Trash2 className="h-5 w-5 text-rose-400" />
              </div>
            </div>

            <p className="mb-1 text-center text-base font-bold text-neutral-50">
              Excluir lançamento?
            </p>
            <p className="mb-6 text-center text-xs text-neutral-500">
              Essa ação não pode ser desfeita.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-neutral-800 py-3 text-sm font-semibold text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setSelectedId(null);
                }}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-rose-400"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
