"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  deleteSpendingBudget,
  loadSpendingBudget,
  saveSpendingBudget,
} from "@/app/_actions/budget";
import {
  calculateSpendingMetrics,
  formatAmountForInput,
  formatBrazilianAmountInput,
  formatCurrency,
  formatDateRange,
  formatPaceLabel,
  formatPercentage,
  getTodayIsoDate,
  isIsoDate,
  parseBrazilianAmount,
  roundMoney,
  type SpendingBudget,
  type SpendingBudgetMetrics,
  type SpendingPace,
} from "./budget-utils";

type SheetMode = "budget" | "add-spending" | "edit-spending" | null;

const paceStyles: Record<SpendingPace, { text: string; background: string }> = {
  within: { text: "text-emerald-400", background: "bg-emerald-950" },
  attention: { text: "text-amber-300", background: "bg-amber-950" },
  exceeded: { text: "text-rose-400", background: "bg-rose-950" },
};

function differenceLabel(difference: number): string {
  return `${formatCurrency(Math.abs(difference))} ${
    difference >= 0 ? "abaixo" : "acima"
  }`;
}

function currentWeekPace(metrics: SpendingBudgetMetrics): SpendingPace {
  if (metrics.pace === "exceeded") return "exceeded";
  return metrics.weekDifference < 0 ? "attention" : "within";
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-1.5 break-words text-lg font-bold text-neutral-100">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-[11px] text-neutral-600">{description}</p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass = "text-neutral-100",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border-b border-neutral-800 py-2 last:border-0">
      <span className="min-w-0 text-sm text-neutral-400">{label}</span>
      <span className={`shrink-0 text-right text-sm font-bold ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function PaceCard({ metrics }: { metrics: SpendingBudgetMetrics }) {
  const colors = paceStyles[metrics.pace];
  const consumedWidth = Math.min(100, Math.max(0, metrics.budgetConsumed));
  const markerPosition = Math.min(100, Math.max(0, metrics.periodProgress));
  const PaceIcon =
    metrics.pace === "exceeded"
      ? X
      : metrics.pace === "attention"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${colors.background} ${colors.text}`}
      >
        <PaceIcon aria-hidden="true" className="h-3.5 w-3.5" />
        {formatPaceLabel(metrics.pace)}
      </span>
      <div
        className="relative mb-4 mt-5 h-3 rounded-full bg-neutral-800"
        role="img"
        aria-label={`Orçamento consumido: ${formatPercentage(metrics.budgetConsumed)}; período transcorrido: ${formatPercentage(metrics.periodProgress)}`}
      >
        <div
          className={`h-full rounded-full ${
            metrics.pace === "exceeded"
              ? "bg-rose-400"
              : metrics.pace === "attention"
                ? "bg-amber-300"
                : "bg-emerald-400"
          }`}
          style={{ width: `${consumedWidth}%` }}
        />
        <span
          className="absolute -top-1 h-5 w-0.5 bg-neutral-100"
          style={{ left: `${markerPosition}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span className="text-neutral-400">Orçamento consumido</span>
        <strong className="text-neutral-100">
          {formatPercentage(metrics.budgetConsumed)}
        </strong>
        <span aria-hidden="true" className="mx-1 h-3 w-px bg-neutral-700" />
        <span className="text-neutral-400">Período transcorrido</span>
        <strong className="text-neutral-100">
          {formatPercentage(metrics.periodProgress)}
        </strong>
      </div>
      <p className="mt-3 text-sm leading-5 text-neutral-400">
        Você usou {formatPercentage(metrics.budgetConsumed)} do orçamento com{" "}
        {formatPercentage(metrics.periodProgress)} do período transcorrido.
      </p>
    </section>
  );
}

export default function BudgetPage() {
  const [budget, setBudget] = useState<SpendingBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [amountInput, setAmountInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [spendingInput, setSpendingInput] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadBudget = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      setBudget(await loadSpendingBudget());
    } catch (error) {
      console.error("Failed to load spending budget.", error);
      setLoadError("Não foi possível carregar o orçamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBudget();
  }, [loadBudget]);

  const openBudgetSheet = () => {
    setAmountInput(budget ? formatAmountForInput(budget.amount) : "");
    setDateInput(budget?.cycleAnchorDate ?? getTodayIsoDate());
    setFormError("");
    setSheetMode("budget");
  };

  const openSpendingSheet = (mode: "add-spending" | "edit-spending") => {
    if (!budget) return;
    setSpendingInput(
      mode === "edit-spending" ? formatAmountForInput(budget.spent) : "",
    );
    setFormError("");
    setSheetMode(mode);
  };

  const persistBudget = async (updatedBudget: SpendingBudget) => {
    setIsSaving(true);
    setFormError("");
    try {
      await saveSpendingBudget(updatedBudget);
      setBudget(updatedBudget);
      setSheetMode(null);
    } catch (error) {
      console.error("Failed to save spending budget.", error);
      setFormError(
        "Não foi possível salvar no Supabase. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBudget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseBrazilianAmount(amountInput);
    if (amount === null || amount <= 0) {
      setFormError("Informe um orçamento maior que zero.");
      return;
    }
    if (!isIsoDate(dateInput)) {
      setFormError("Informe uma data válida para o início do ciclo.");
      return;
    }

    const previousSpent = budget?.spent ?? 0;
    const candidate: SpendingBudget = {
      amount: roundMoney(amount),
      startDate: dateInput,
      cycleAnchorDate: dateInput,
      spent: previousSpent,
      weeklySpent: budget?.weeklySpent ?? 0,
      weeklyStartDate: budget?.weeklyStartDate ?? dateInput,
    };
    const metrics = calculateSpendingMetrics(candidate);
    const activeStartDate = metrics.startDate.toISOString().slice(0, 10);
    const sameCycle = budget?.startDate === activeStartDate;
    candidate.startDate = activeStartDate;
    candidate.spent = sameCycle ? previousSpent : 0;
    candidate.weeklySpent =
      candidate.weeklyStartDate === metrics.weekStart.toISOString().slice(0, 10)
        ? sameCycle
          ? candidate.weeklySpent
          : 0
        : 0;
    candidate.weeklyStartDate = metrics.weekStart.toISOString().slice(0, 10);
    await persistBudget(candidate);
  };

  const handleSaveSpending = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!budget) return;

    const value = parseBrazilianAmount(spendingInput);
    if (value === null || (sheetMode === "add-spending" && value <= 0)) {
      setFormError(
        sheetMode === "add-spending"
          ? "Informe um valor maior que zero."
          : "Informe um total gasto válido.",
      );
      return;
    }

    const metrics = calculateSpendingMetrics(budget);
    const currentWeekStart = metrics.weekStart.toISOString().slice(0, 10);
    const weekAmount =
      budget.weeklyStartDate === currentWeekStart ? budget.weeklySpent : 0;

    if (sheetMode === "add-spending") {
      await persistBudget({
        ...budget,
        spent: roundMoney(budget.spent + value),
        weeklySpent: roundMoney(weekAmount + value),
        weeklyStartDate: currentWeekStart,
      });
      return;
    }

    const correctedSpending = roundMoney(value);
    const weekAdjustment = correctedSpending - budget.spent;
    await persistBudget({
      ...budget,
      spent: correctedSpending,
      weeklySpent: Math.min(
        correctedSpending,
        Math.max(0, weekAmount + weekAdjustment),
      ),
      weeklyStartDate: currentWeekStart,
    });
  };

  const handleDeleteBudget = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteSpendingBudget();
      setBudget(null);
      setIsDeleteConfirmationVisible(false);
    } catch (error) {
      console.error("Failed to delete spending budget.", error);
      setDeleteError("Não foi possível excluir o orçamento. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const metrics = budget ? calculateSpendingMetrics(budget) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
          Orçamento
        </h1>
        {budget && (
          <button
            type="button"
            onClick={openBudgetSheet}
            aria-label="Configurar orçamento"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 transition hover:text-neutral-100"
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </header>

      {isLoading ? (
        <output className="py-10 text-center text-sm text-neutral-500">
          Carregando orçamento...
        </output>
      ) : loadError ? (
        <div className="flex flex-wrap items-center justify-center gap-3 py-10">
          <p role="alert" className="text-sm text-rose-300">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void loadBudget()}
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Tentar novamente
          </button>
        </div>
      ) : budget && metrics ? (
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-50">
                Ritmo de gastos
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {formatDateRange(metrics.startDate, metrics.endDate)} · dia{" "}
                {metrics.elapsedDays} de {metrics.totalDays}
              </p>
            </div>
          </div>

          <div className="my-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-neutral-400">Saldo disponível</p>
              <p
                className={`mt-1 break-words text-3xl font-bold sm:text-4xl ${
                  metrics.balance < 0 ? "text-rose-400" : "text-neutral-50"
                }`}
              >
                {formatCurrency(metrics.balance)}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                de {formatCurrency(budget.amount)} de orçamento
              </p>
            </div>
            <button
              type="button"
              onClick={() => openSpendingSheet("add-spending")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Atualizar gastos
            </button>
          </div>

          <PaceCard metrics={metrics} />

          <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              title="Orçamento total"
              value={formatCurrency(budget.amount)}
            />
            <MetricCard
              title="Total gasto"
              value={formatCurrency(budget.spent)}
            />
            <MetricCard
              title="Média diária atual"
              value={formatCurrency(metrics.dailyAverage)}
              description="gasto ÷ dias transcorridos"
            />
            <MetricCard
              title="Recomendado por dia"
              value={formatCurrency(metrics.recommendedPerDay)}
              description="para o restante do período"
            />
          </div>

          <section className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-neutral-100">
              <CalendarDays
                aria-hidden="true"
                className="h-4 w-4 text-neutral-500"
              />
              Acompanhamento diário
            </h3>
            <DetailRow
              label="Esperado até hoje"
              value={formatCurrency(metrics.expectedSpent)}
            />
            <DetailRow
              label="Gasto até hoje"
              value={formatCurrency(budget.spent)}
            />
            <DetailRow
              label="Diferença"
              value={differenceLabel(metrics.dailyDifference)}
              valueClass={
                metrics.dailyDifference >= 0
                  ? "text-emerald-400"
                  : "text-amber-300"
              }
            />
            <DetailRow
              label="Ainda pode gastar por dia"
              value={formatCurrency(metrics.recommendedPerDay)}
            />
            <p className="mt-3 text-[11px] text-neutral-600">
              Referência diária: {formatCurrency(metrics.dailyReference)}.
              Restam {metrics.remainingDays} dias após hoje.
            </p>
          </section>

          <WeeklyCard budget={budget} metrics={metrics} />
          <ForecastCard budget={budget} metrics={metrics} />
        </section>
      ) : (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900 px-6 py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
            <Wallet aria-hidden="true" className="h-5 w-5 text-neutral-400" />
          </span>
          <h2 className="text-base font-bold text-neutral-50">
            Defina seu orçamento do período
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-5 text-neutral-400">
            Informe quanto pretende gastar e o início do ciclo mensal para
            acompanhar o ritmo dos seus gastos.
          </p>
          <button
            type="button"
            onClick={openBudgetSheet}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Definir orçamento
          </button>
        </section>
      )}

      {sheetMode && (
        <BudgetDialog
          budget={budget}
          mode={sheetMode}
          amountInput={amountInput}
          dateInput={dateInput}
          spendingInput={spendingInput}
          formError={formError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setSheetMode(null);
              setFormError("");
            }
          }}
          onAmountChange={setAmountInput}
          onDateChange={setDateInput}
          onSpendingChange={setSpendingInput}
          onSaveBudget={handleSaveBudget}
          onSaveSpending={handleSaveSpending}
          onChangeMode={setSheetMode}
          onDelete={() => {
            setSheetMode(null);
            setDeleteError("");
            setIsDeleteConfirmationVisible(true);
          }}
        />
      )}

      {isDeleteConfirmationVisible && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-budget-title"
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
          >
            <h2
              id="delete-budget-title"
              className="text-lg font-bold text-neutral-50"
            >
              Excluir orçamento?
            </h2>
            <p className="mt-2 text-sm leading-5 text-neutral-400">
              Essa ação apagará o orçamento e os gastos registrados nele. Você
              poderá criar um novo depois.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-rose-400">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteConfirmationVisible(false)}
                className="min-h-11 flex-1 rounded-xl border border-neutral-700 text-sm text-neutral-200 transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeleteBudget()}
                className="min-h-11 flex-1 rounded-xl bg-rose-500 text-sm font-bold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir orçamento"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function WeeklyCard({
  budget,
  metrics,
}: {
  budget: SpendingBudget;
  metrics: SpendingBudgetMetrics;
}) {
  const pace = currentWeekPace(metrics);
  const styles = paceStyles[pace];
  const hasWeekStarted = metrics.elapsedDays > (metrics.weekNumber - 1) * 7;
  const weekDays =
    Math.round(
      (metrics.weekEnd.getTime() - metrics.weekStart.getTime()) / 86400000,
    ) + 1;

  return (
    <section className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-100">
          Semana · {formatDateRange(metrics.weekStart, metrics.weekEnd)}
        </h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles.background} ${styles.text}`}
        >
          {formatPaceLabel(pace)}
        </span>
      </div>
      <DetailRow
        label="Referência da semana"
        value={formatCurrency(metrics.weekReference)}
      />
      <DetailRow
        label="Gasto na semana"
        value={formatCurrency(
          budget.weeklyStartDate ===
            metrics.weekStart.toISOString().slice(0, 10)
            ? budget.weeklySpent
            : 0,
        )}
      />
      <DetailRow
        label="Diferença"
        value={differenceLabel(metrics.weekDifference)}
        valueClass={
          metrics.weekDifference >= 0 ? "text-emerald-400" : "text-amber-300"
        }
      />
      {hasWeekStarted && metrics.weekDifference < 0 ? (
        <p className="mt-3 text-xs leading-5 text-amber-300">
          Para compensar, mantenha até{" "}
          {formatCurrency(metrics.recommendedPerDay)} por dia (~
          {formatCurrency(metrics.recommendedPerDay * 7)} por semana) nos
          próximos dias.
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-neutral-600">
          Referência: {formatCurrency(metrics.dailyReference)} por dia ×{" "}
          {weekDays} dias.
        </p>
      )}
    </section>
  );
}

function ForecastCard({
  budget,
  metrics,
}: {
  budget: SpendingBudget;
  metrics: SpendingBudgetMetrics;
}) {
  const isOverBudget =
    metrics.pace === "exceeded" || metrics.projectedTotal > budget.amount;
  const isAtRisk = !isOverBudget && metrics.pace === "attention";
  const messageClass = isOverBudget
    ? "text-rose-400"
    : isAtRisk
      ? "text-amber-300"
      : "text-emerald-400";
  const ForecastIcon = isOverBudget
    ? X
    : isAtRisk
      ? AlertTriangle
      : CheckCircle2;

  let message: string;
  if (metrics.pace === "exceeded") {
    message =
      "O orçamento já foi totalmente consumido antes do fim do período.";
  } else if (metrics.projectedTotal > budget.amount) {
    const daysEarly = Math.max(
      0,
      metrics.remainingDays -
        (metrics.daysUntilBudgetRunsOut ?? metrics.remainingDays),
    );
    message = `Risco: no ritmo atual, o orçamento acaba antes do fim do período, cerca de ${daysEarly} dias antes.`;
  } else if (metrics.projectedTotal > budget.amount * 0.9) {
    message = "A previsão está próxima do limite; vale moderar os gastos.";
  } else {
    message = `No ritmo atual, o orçamento deve ser suficiente e sobrar cerca de ${formatCurrency(budget.amount - metrics.projectedTotal)}.`;
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-neutral-100">
        <TrendingUp aria-hidden="true" className="h-4 w-4 text-neutral-500" />
        Previsão de encerramento
      </h3>
      <p className="text-2xl font-bold text-neutral-50">
        {formatCurrency(metrics.projectedTotal)}
      </p>
      <p
        className={`mt-2 flex items-start gap-2 text-sm leading-5 ${messageClass}`}
      >
        <ForecastIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </p>
      <p className="mt-2 text-[11px] text-neutral-600">
        Estimativa mantendo a média diária de{" "}
        {formatCurrency(metrics.dailyAverage)} por {metrics.totalDays} dias.
      </p>
    </section>
  );
}

function BudgetDialog({
  budget,
  mode,
  amountInput,
  dateInput,
  spendingInput,
  formError,
  isSaving,
  onClose,
  onAmountChange,
  onDateChange,
  onSpendingChange,
  onSaveBudget,
  onSaveSpending,
  onChangeMode,
  onDelete,
}: {
  budget: SpendingBudget | null;
  mode: Exclude<SheetMode, null>;
  amountInput: string;
  dateInput: string;
  spendingInput: string;
  formError: string;
  isSaving: boolean;
  onClose: () => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSpendingChange: (value: string) => void;
  onSaveBudget: (event: React.FormEvent<HTMLFormElement>) => void;
  onSaveSpending: (event: React.FormEvent<HTMLFormElement>) => void;
  onChangeMode: (mode: SheetMode) => void;
  onDelete: () => void;
}) {
  const isBudgetMode = mode === "budget";
  const isAddMode = mode === "add-spending";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-dialog-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-neutral-800 bg-neutral-950 p-5 sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="budget-dialog-title"
            className="text-base font-bold text-neutral-50"
          >
            {isBudgetMode ? "Orçamento do período" : "Atualizar gastos"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:text-neutral-100 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {isBudgetMode ? (
          <form onSubmit={onSaveBudget} className="space-y-4">
            <label className="block text-xs text-neutral-400">
              Orçamento disponível
              <span className="mt-2 flex h-16 items-center justify-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 px-4">
                <span className="text-base font-bold text-neutral-400">R$</span>
                <input
                  aria-label="Valor do orçamento em reais"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) =>
                    onAmountChange(
                      formatBrazilianAmountInput(event.target.value),
                    )
                  }
                  placeholder="0,00"
                  className="w-40 bg-transparent text-center text-2xl font-bold text-neutral-50 outline-none placeholder:text-neutral-600 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </span>
            </label>
            <label className="block text-xs text-neutral-400">
              Início do ciclo mensal
              <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-3">
                <input
                  type="date"
                  aria-label="Data de início do ciclo"
                  value={dateInput}
                  onChange={(event) => onDateChange(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none scheme-dark"
                />
                <CalendarDays
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-neutral-400"
                />
              </span>
            </label>
            <p className="text-xs leading-5 text-neutral-500">
              O ciclo se repete nesse dia todos os meses. Por exemplo, começando
              no dia 5, os gastos contam do dia 5 até o dia 4 do mês seguinte.
            </p>
            {formError && (
              <p role="alert" className="text-sm text-rose-400">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar orçamento"}
            </button>
            {budget && (
              <button
                type="button"
                disabled={isSaving}
                onClick={onDelete}
                className="h-12 w-full rounded-xl border border-rose-500 text-sm font-bold text-rose-400 transition hover:bg-rose-950/50 disabled:opacity-50"
              >
                Excluir orçamento
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={onSaveSpending} className="space-y-4">
            <fieldset className="grid grid-cols-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-1">
              <legend className="sr-only">Tipo de atualização de gastos</legend>
              <button
                type="button"
                aria-pressed={isAddMode}
                onClick={() => onChangeMode("add-spending")}
                className={`rounded-xl px-3 py-3 text-sm font-bold ${
                  isAddMode
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                Adicionar gasto
              </button>
              <button
                type="button"
                aria-pressed={!isAddMode}
                onClick={() => onChangeMode("edit-spending")}
                className={`rounded-xl px-3 py-3 text-sm font-bold ${
                  !isAddMode
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                Corrigir total
              </button>
            </fieldset>
            <label className="block text-xs text-neutral-400">
              {isAddMode ? "Valor do novo gasto" : "Valor do gasto corrigido"}
              <span className="mt-2 flex h-16 items-center justify-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 px-4">
                <span className="text-base font-bold text-neutral-400">R$</span>
                <input
                  aria-label="Valor do gasto em reais"
                  inputMode="decimal"
                  value={spendingInput}
                  onChange={(event) =>
                    onSpendingChange(
                      formatBrazilianAmountInput(event.target.value),
                    )
                  }
                  placeholder="0,00"
                  className="w-40 bg-transparent text-center text-2xl font-bold text-neutral-50 outline-none placeholder:text-neutral-600 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </span>
            </label>
            <p className="text-xs text-neutral-500">
              {isAddMode
                ? "Esse valor será somado ao total já gasto."
                : "Informe o total correto; não será somado ao valor atual."}
            </p>
            {budget && (
              <div className="border-t border-neutral-800 pt-2">
                <DetailRow
                  label="Total gasto"
                  value={formatCurrency(budget.spent)}
                />
                <DetailRow
                  label="Saldo disponível"
                  value={formatCurrency(
                    Math.max(0, budget.amount - budget.spent),
                  )}
                />
              </div>
            )}
            {formError && (
              <p role="alert" className="text-sm text-rose-400">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSaving
                ? "Salvando..."
                : isAddMode
                  ? "Adicionar gasto"
                  : "Salvar correção"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
