"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MonthlyTransaction } from "@/app/_actions/dashboard";
import { getMonthlyTransactions } from "@/app/_actions/dashboard";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  INITIAL_PERIOD,
  MonthSelector,
  type Period,
} from "@/components/MonthSelector";
import { getCategoryIcon } from "@/data/categories";

type TransactionType = "expense" | "income";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export default function TransactionsPage() {
  const [period, setPeriod] = useState<Period>(INITIAL_PERIOD);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [transactions, setTransactions] = useState<MonthlyTransaction[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const requestId = useRef(0);

  const loadTransactions = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setHasError(false);

    try {
      const result = await getMonthlyTransactions(period.month, period.year);
      if (currentRequestId === requestId.current) {
        setTransactions(result);
      }
    } catch (error) {
      console.error("Failed to load monthly transactions.", error);
      if (currentRequestId === requestId.current) {
        setHasError(true);
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setIsLoading(false);
      }
    }
  }, [period]);

  useEffect(() => {
    void loadTransactions();

    return () => {
      requestId.current += 1;
    };
  }, [loadTransactions]);

  const visibleTransactions =
    transactions?.filter((transaction) =>
      transactionType === "income"
        ? transaction.amount > 0
        : transaction.amount < 0,
    ) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
          Movimentações
        </h1>
        <MonthSelector period={period} onChangePeriod={setPeriod} />
      </header>

      <fieldset className="grid grid-cols-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-1">
        <legend className="sr-only">Filtrar movimentações por tipo</legend>
        <button
          type="button"
          aria-pressed={transactionType === "expense"}
          onClick={() => setTransactionType("expense")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${
            transactionType === "expense"
              ? "bg-neutral-100 text-neutral-950"
              : "text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          Saídas
        </button>
        <button
          type="button"
          aria-pressed={transactionType === "income"}
          onClick={() => setTransactionType("income")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${
            transactionType === "income"
              ? "bg-neutral-100 text-neutral-950"
              : "text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          Entradas
        </button>
      </fieldset>

      <section aria-busy={isLoading}>
        {isLoading ? (
          <p className="py-4 text-sm text-neutral-500">
            Carregando movimentações...
          </p>
        ) : hasError ? (
          <div className="flex flex-wrap items-center gap-3 py-6">
            <p role="alert" className="text-sm text-rose-300">
              Não foi possível carregar as movimentações.
            </p>
            <button
              type="button"
              onClick={() => void loadTransactions()}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Tentar novamente
            </button>
          </div>
        ) : visibleTransactions.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            Nenhuma {transactionType === "expense" ? "saída" : "entrada"}{" "}
            registrada neste período.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {visibleTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex min-w-0 items-center gap-3 py-4 sm:gap-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-800">
                  <DynamicIcon
                    name={getCategoryIcon(transaction.category)}
                    className="h-5 w-5 text-neutral-300"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-neutral-100 sm:text-lg">
                    {transaction.category}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {transactionType === "expense" ? "Saída" : "Entrada"} ·{" "}
                    {dateFormatter.format(
                      new Date(`${transaction.transactionDate}T00:00:00Z`),
                    )}
                  </p>
                </div>

                <p className="shrink-0 text-right text-base font-bold text-neutral-100 sm:text-lg">
                  {currencyFormatter.format(transaction.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
