"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Car,
  Clock,
  Coffee,
  Home,
  LogOut,
  type LucideIcon,
  MousePointerClick,
  Pencil,
  Plus,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  Wifi,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMonthlyTotals } from "@/app/_actions/dashboard";
import { BalanceSummary } from "@/components/BalanceSummary";
import {
  type CategoryExpense,
  CategoryExpenseSummary,
} from "@/components/CategoryExpenseSummary";
import { INITIAL_PERIOD, type Period } from "@/components/MonthSelector";
import { SummaryMetricCard } from "@/components/SummaryMetricCard";
import { signOut } from "../_actions/auth";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap";

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

function DetailPanel({
  tx,
  onClose,
  onDelete,
}: {
  tx: Transaction | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  if (!tx) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 px-8 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
          <MousePointerClick className="h-5 w-5 text-neutral-600" />
        </div>
        <p className="mb-1 text-sm font-semibold text-neutral-400">
          Nenhuma movimentação selecionada
        </p>
        <p className="text-xs text-neutral-600">
          Clique em um item da lista para ver os detalhes aqui.
        </p>
      </div>
    );
  }

  const Icon = tx.icon;
  const accent = tx.income ? "#34d399" : "#f5f5f5";
  const rows = [
    {
      label: "Tipo",
      value: tx.income ? "Entrada" : "Saída",
      icon: tx.income ? ArrowDownRight : ArrowUpRight,
    },
    { label: "Categoria", value: tx.category, icon: Tag },
    { label: "Data", value: tx.date, icon: Calendar },
    { label: "Criado em", value: `${tx.date} às ${tx.time}`, icon: Clock },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-50">Detalhes</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-rose-400 transition-colors hover:bg-neutral-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center pb-6">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
          <Icon className="h-6 w-6 text-neutral-300" />
        </div>
        <p className="mb-1 text-sm font-medium text-neutral-400">{tx.name}</p>
        <p
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: accent }}
        >
          {currency(tx.amount)}
        </p>
      </div>

      <div className="mb-5 divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-950">
        {rows.map((row) => {
          const RowIcon = row.icon;

          return (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3">
              <RowIcon className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="flex-1 text-xs text-neutral-500">
                {row.label}
              </span>
              <span className="text-sm font-medium text-neutral-50">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent, color: "#0a0a0a" }}
      >
        <Pencil className="h-4 w-4" />
        Editar lançamento
      </button>
    </div>
  );
}

export default function FinrHomeDesktop() {
  const [period, setPeriod] = useState<Period>(INITIAL_PERIOD);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals | null>(
    null,
  );
  const [isLoadingTotals, setIsLoadingTotals] = useState(true);
  const [totalsError, setTotalsError] = useState(false);
  const totalsRequestId = useRef(0);

  const loadMonthlyTotals = useCallback(async () => {
    const requestId = ++totalsRequestId.current;
    setIsLoadingTotals(true);
    setTotalsError(false);
    setMonthlyTotals(null);

    try {
      const totals = await getMonthlyTotals(period.month, period.year);

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
  }, [period.month, period.year]);

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

  const nav = [
    { icon: Home, label: "Início", active: true },
    { icon: User, label: "Perfil" },
  ];

  return (
    <div
      style={{ fontFamily: "'Urbanist', sans-serif" }}
      className="flex min-h-screen bg-neutral-950"
    >
      <link rel="stylesheet" href={FONT_LINK} />

      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-neutral-800 px-4 py-6">
        <div>
          <div className="mb-8 px-2">
            <span className="text-lg font-bold leading-tight text-neutral-50">
              Finanças Pessoais
            </span>
          </div>

          <button
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Lançar
          </button>

          <nav className="space-y-1">
            {nav.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-neutral-900 text-neutral-50"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-emerald-400" : ""}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Configurações</span>
          </button>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-10 py-10">
        <div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_380px] items-start gap-8">
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

          <div className="sticky top-10 min-h-[420px]">
            <DetailPanel
              tx={selectedTx}
              onClose={() => setSelectedId(null)}
              onDelete={() => setConfirmDelete(true)}
            />
          </div>
        </div>
      </main>

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
