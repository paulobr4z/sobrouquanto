"use client";

import { CheckCircle2, Repeat, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MonthlyTransaction } from "@/app/_actions/dashboard";
import { useDashboardDataCache } from "@/app/(authenticated)/dashboard-data-cache";
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

export function TransactionsList({
  initialType,
  initialSuccessType,
}: {
  initialType: TransactionType;
  initialSuccessType: TransactionType | null;
}) {
  const router = useRouter();
  const { getMonthlyTransactions, invalidate, loadMonthlyTransactions } =
    useDashboardDataCache();
  const [period, setPeriod] = useState<Period>(INITIAL_PERIOD);
  const cachedTransactions = getMonthlyTransactions(period);
  const [transactionType, setTransactionType] =
    useState<TransactionType>(initialType);
  const [successType, setSuccessType] = useState(initialSuccessType);
  const [transactions, setTransactions] = useState<MonthlyTransaction[] | null>(
    cachedTransactions,
  );
  const [isLoading, setIsLoading] = useState(cachedTransactions === null);
  const [hasError, setHasError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setTransactionType(initialType);
  }, [initialType]);

  useEffect(() => {
    setSuccessType(initialSuccessType);
  }, [initialSuccessType]);

  useEffect(() => {
    if (initialSuccessType) {
      invalidate();
    }
  }, [initialSuccessType, invalidate]);

  const loadTransactions = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    const cachedResult = getMonthlyTransactions(period);
    if (cachedResult) {
      setTransactions(cachedResult);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      const result = await loadMonthlyTransactions(period);
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
  }, [getMonthlyTransactions, loadMonthlyTransactions, period]);

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

      {successType && (
        <output
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-emerald-400"
          />
          <span className="flex-1">
            {successType === "income" ? "Entrada" : "Saída"} lançada com
            sucesso.
          </span>
          <button
            type="button"
            aria-label="Fechar mensagem de sucesso"
            onClick={() => {
              setSuccessType(null);
              router.replace(`/transactions?type=${transactionType}`, {
                scroll: false,
              });
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-300 transition hover:bg-emerald-500/10"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </output>
      )}

      <fieldset className="grid grid-cols-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-1">
        <legend className="sr-only">Filtrar movimentações por tipo</legend>
        <button
          type="button"
          aria-pressed={transactionType === "expense"}
          onClick={() => {
            setTransactionType("expense");
            router.replace("/transactions?type=expense", { scroll: false });
          }}
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
          onClick={() => {
            setTransactionType("income");
            router.replace("/transactions?type=income", { scroll: false });
          }}
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
              <li key={transaction.id} className="min-w-0">
                <Link
                  href={{
                    pathname: "/transactions/details",
                    query: { id: transaction.id },
                  }}
                  className="flex min-w-0 cursor-pointer items-center gap-3 py-4 sm:gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-800">
                    <DynamicIcon
                      name={getCategoryIcon(transaction.category)}
                      className="h-5 w-5 text-neutral-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-neutral-100 sm:text-lg">
                      {transaction.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
                      <span>
                        {transaction.category} ·{" "}
                        {dateFormatter.format(
                          new Date(`${transaction.transactionDate}T00:00:00Z`),
                        )}
                      </span>
                      {transaction.isRecurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                          <Repeat aria-hidden="true" className="h-3 w-3" />
                          Recorrente
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="shrink-0 text-right text-base font-bold text-neutral-100 sm:text-lg">
                    {currencyFormatter.format(transaction.amount)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
