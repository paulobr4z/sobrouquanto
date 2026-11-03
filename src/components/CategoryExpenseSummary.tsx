import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import type { Period } from "@/components/MonthSelector";
import { getCategoryIcon } from "@/data/categories";

export type CategoryExpense = {
  category: string;
  amount: number;
  previousAmount: number;
};

type CategoryExpenseSummaryProps = {
  categories: CategoryExpense[] | null;
  period: Period;
  isLoading: boolean;
  hasError: boolean;
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function CategoryExpenseSummary({
  categories,
  period,
  isLoading,
  hasError,
}: CategoryExpenseSummaryProps) {
  const periodDate = new Date(Date.UTC(period.year, period.month, 1));
  const isCurrentMonth =
    period.month === new Date().getMonth() &&
    period.year === new Date().getFullYear();
  const periodLabel = isCurrentMonth
    ? "Este mês"
    : monthFormatter.format(periodDate);
  const totalAmount = (categories ?? []).reduce(
    (total, { amount }) => total + amount,
    0,
  );

  return (
    <section
      aria-label="Gastos por categoria"
      aria-busy={isLoading}
      className="w-full min-w-0 rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold text-neutral-50">
          Gastos por categoria
        </h2>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 text-right text-xs text-neutral-500">
          <span>{periodLabel}</span>
          {!isLoading && !hasError && categories !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {categories.length}{" "}
                {categories.length === 1 ? "categoria" : "categorias"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-neutral-300">
                {currencyFormatter.format(totalAmount)}
              </span>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Carregando categorias...</p>
      ) : hasError || categories === null ? (
        <p className="text-sm text-neutral-500">
          Não foi possível carregar os gastos por categoria.
        </p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhum gasto registrado neste período.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800">
          {categories.map(({ category, amount, previousAmount }) => {
            const share =
              totalAmount > 0
                ? Math.min(100, Math.max(0, (amount / totalAmount) * 100))
                : 0;
            const difference = amount - previousAmount;
            const changePercent =
              previousAmount > 0
                ? Math.round((Math.abs(difference) / previousAmount) * 100)
                : null;
            const shareLabel = share.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            const changeLabel =
              previousAmount === 0
                ? amount === 0
                  ? "Estável"
                  : "Novo"
                : difference === 0
                  ? "Estável"
                  : `${changePercent}%`;
            const changeClassName =
              previousAmount === 0 && amount > 0
                ? "bg-neutral-800 text-neutral-300"
                : difference > 0
                  ? "bg-amber-500/10 text-amber-400"
                  : difference < 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-neutral-500";
            const ChangeIcon =
              previousAmount === 0 && amount > 0
                ? Plus
                : difference > 0
                  ? ArrowUp
                  : difference < 0
                    ? ArrowDown
                    : Minus;

            return (
              <li
                key={category}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 py-3 first:pt-1 last:pb-1"
              >
                <div className="row-span-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                  <DynamicIcon
                    name={getCategoryIcon(category)}
                    className="h-4 w-4 text-neutral-300"
                  />
                </div>
                <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-neutral-100">
                    {category}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-neutral-100">
                    {currencyFormatter.format(amount)}
                  </span>
                </div>
                <div
                  className="col-start-2 row-start-2 h-1.5 overflow-hidden rounded-full bg-neutral-800"
                  role="progressbar"
                  aria-label={`Gastos em ${category}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={share}
                  aria-valuetext={`${shareLabel}% do total`}
                >
                  <div
                    className="h-full rounded-full bg-neutral-400"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <div className="col-start-2 row-start-3 flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-xs text-neutral-500">
                    {shareLabel}% do total
                  </span>
                  <span
                    role="img"
                    aria-label={`${changeLabel} em relação ao mês anterior`}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${changeClassName}`}
                  >
                    <ChangeIcon aria-hidden="true" className="h-3 w-3" />
                    {changeLabel}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
