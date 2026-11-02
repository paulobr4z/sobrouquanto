"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { TransactionFormState } from "@/app/_actions/transactions";
import { createTransaction } from "@/app/_actions/transactions";
import { CategoryPicker } from "@/components/CategoryPicker";
import type { Category } from "@/data/categories";
import { formatBrazilianAmountInput } from "@/lib/currency";

const initialState: TransactionFormState = {
  status: "idle",
  message: "",
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10";

export function NewTransactionForm() {
  const [state, formAction, isPending] = useActionState(
    createTransaction,
    initialState,
  );
  const [amountInput, setAmountInput] = useState("");
  const [transactionType, setTransactionType] = useState<
    "expense" | "income" | null
  >("expense");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedCategory) {
      event.preventDefault();
      setCategoryError(true);
      setIsCategoryDialogOpen(true);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
      <form action={formAction} onSubmit={handleSubmit}>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-neutral-200">
            Tipo de movimentação
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="transactionType"
                value="expense"
                checked={transactionType === "expense"}
                onChange={() => setTransactionType("expense")}
                required
                className="peer sr-only"
              />
              <span className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm font-semibold text-neutral-400 transition peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500">
                <ArrowDownRight aria-hidden="true" className="h-4 w-4" />
                Saída
              </span>
            </label>
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="transactionType"
                value="income"
                checked={transactionType === "income"}
                onChange={() => setTransactionType("income")}
                required
                className="peer sr-only"
              />
              <span className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm font-semibold text-neutral-400 transition peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500">
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                Entrada
              </span>
            </label>
          </div>
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="transaction-description"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Descrição
            </label>
            <input
              id="transaction-description"
              name="description"
              type="text"
              required
              placeholder="Ex.: compras da semana"
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor="transaction-amount"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Valor
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-neutral-500">
                R$
              </span>
              <input
                id="transaction-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                value={amountInput}
                onChange={(event) =>
                  setAmountInput(formatBrazilianAmountInput(event.target.value))
                }
                placeholder="0,00"
                className={`${fieldClassName} pl-12`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="transaction-category"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Categoria
            </label>
            <CategoryPicker
              selectedCategory={selectedCategory}
              isOpen={isCategoryDialogOpen}
              hasError={categoryError}
              onOpenChange={setIsCategoryDialogOpen}
              onSelect={(category) => {
                setSelectedCategory(category);
                setCategoryError(false);
                setIsCategoryDialogOpen(false);
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="transaction-date"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Data
            </label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              />
              <input
                id="transaction-date"
                name="date"
                type="date"
                required
                className={`${fieldClassName} pl-11 [color-scheme:dark]`}
              />
            </div>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <input
            type="checkbox"
            name="isRecurring"
            className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          <span className="flex-1">
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
              <Repeat aria-hidden="true" className="h-4 w-4 text-neutral-400" />
              Marcar como recorrente
            </span>
            <span className="mt-1 block text-xs leading-5 text-neutral-500">
              A recorrência fica registrada como mensal, sem agendar novos
              lançamentos.
            </span>
          </span>
        </label>

        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-neutral-800 pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/transactions"
            className="flex h-12 items-center justify-center rounded-xl border border-neutral-800 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-900 hover:text-neutral-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Salvar movimentação"}
          </button>
        </div>
      </form>
    </section>
  );
}
