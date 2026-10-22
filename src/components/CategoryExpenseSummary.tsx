import { DynamicIcon } from "@/components/DynamicIcon";
import type { Period } from "@/components/MonthSelector";
import { getCategoryIcon } from "@/data/categories";

export type CategoryExpense = {
  category: string;
  amount: number;
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
  const maxAmount = Math.max(
    0,
    ...(categories ?? []).map((category) => category.amount),
  );

  return (
    <section aria-label="Gastos por categoria" aria-busy={isLoading}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-neutral-50">
          Gastos por categoria
        </h2>
        <span className="shrink-0 text-xs text-neutral-500">{periodLabel}</span>
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
        <ul className="space-y-3">
          {categories.map(({ category, amount }) => {
            const progress = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

            return (
              <li
                key={category}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3"
              >
                <div className="row-span-2 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800">
                  <DynamicIcon
                    name={getCategoryIcon(category)}
                    className="h-4 w-4 text-neutral-300"
                  />
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-base font-medium text-neutral-100">
                    {category}
                  </span>
                  <span className="shrink-0 text-base font-semibold text-neutral-100">
                    {currencyFormatter.format(amount)}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-neutral-800"
                  role="progressbar"
                  aria-label={`Gastos em ${category}`}
                  aria-valuemin={0}
                  aria-valuemax={maxAmount}
                  aria-valuenow={amount}
                >
                  <div
                    className="h-full rounded-full bg-neutral-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
