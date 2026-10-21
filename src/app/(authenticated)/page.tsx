"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Home,
  LogOut,
  type LucideIcon,
  MousePointerClick,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "../_actions/auth";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap";

const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const TODAY: { month: number; year: number } = { month: 8, year: 2026 };

type Period = {
  month: number;
  year: number;
};

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

function MonthPicker({
  selected,
  onApply,
}: {
  selected: Period;
  onApply: (period: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected.year);
  const [draft, setDraft] = useState<Period>(selected);

  const openPicker = () => {
    setViewYear(selected.year);
    setDraft(selected);
    setOpen(true);
  };

  const draftIsToday = draft.month === TODAY.month && draft.year === TODAY.year;
  const draftChanged =
    draft.month !== selected.month || draft.year !== selected.year;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
      >
        <span className="whitespace-nowrap text-sm font-semibold text-neutral-300">
          {MONTHS_FULL[selected.month]} de {selected.year}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar seletor de período"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
          />
          <div className="absolute right-0 top-9 z-20 w-80 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-50">Período</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 transition-colors hover:text-neutral-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setViewYear((year) => year - 1)}
                className="flex h-7 w-7 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-base font-bold text-neutral-50 tabular-nums">
                {viewYear}
              </span>
              <button
                type="button"
                onClick={() => setViewYear((year) => year + 1)}
                className="flex h-7 w-7 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((monthName, monthIndex) => {
                const isDraft =
                  draft.month === monthIndex && draft.year === viewYear;
                const isToday =
                  TODAY.month === monthIndex && TODAY.year === viewYear;
                const isFuture =
                  viewYear > TODAY.year ||
                  (viewYear === TODAY.year && monthIndex > TODAY.month);

                return (
                  <button
                    key={monthName}
                    type="button"
                    disabled={isFuture}
                    onClick={() =>
                      setDraft({ month: monthIndex, year: viewYear })
                    }
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                      isDraft
                        ? "border-emerald-400 text-emerald-400"
                        : isFuture
                          ? "cursor-not-allowed border-transparent text-neutral-800"
                          : isToday
                            ? "border-neutral-700 text-neutral-100 hover:bg-neutral-900"
                            : "border-transparent text-neutral-400 hover:bg-neutral-900"
                    }`}
                  >
                    {monthName}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewYear(TODAY.year);
                  setDraft(TODAY);
                }}
                disabled={draftIsToday}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Mês atual
              </button>

              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                disabled={!draftChanged}
                className="flex-1 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-emerald-500"
              >
                Aplicar período
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
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
  const [period, setPeriod] = useState<Period>(TODAY);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { transactions, income, expenses } = getDataForPeriod(period);
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
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Saldo</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight text-neutral-50">
                  R$ 50.000,00
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-emerald-400">
                    +8,4%
                  </span>
                  <span className="text-sm text-neutral-500">
                    vs mês passado
                  </span>
                </div>
              </div>

              <div className="pt-1.5">
                <MonthPicker selected={period} onApply={applyPeriod} />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
                  <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-neutral-400">Entradas</p>
                <p className="mt-0.5 text-2xl font-bold text-neutral-50">
                  {currency(income)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800">
                  <ArrowUpRight className="h-4 w-4 text-neutral-300" />
                </div>
                <p className="text-sm font-medium text-neutral-400">Saídas</p>
                <p className="mt-0.5 text-2xl font-bold text-neutral-50">
                  {currency(expenses)}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="mb-2 text-base font-semibold text-neutral-50">
                Movimentações
              </h2>
              <div className="divide-y divide-neutral-800">
                {transactions.map((transaction) => {
                  const Icon = transaction.icon;
                  const active = transaction.id === selectedId;

                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => setSelectedId(transaction.id)}
                      className={`flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition-colors ${
                        active ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          transaction.income
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-50">
                          {transaction.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {transaction.date}
                        </p>
                      </div>

                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          transaction.income
                            ? "text-emerald-400"
                            : "text-neutral-50"
                        }`}
                      >
                        {currency(transaction.amount)}
                      </p>
                    </button>
                  );
                })}
              </div>
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
