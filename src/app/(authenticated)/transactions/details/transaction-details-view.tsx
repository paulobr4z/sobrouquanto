"use client";

import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  deleteTransaction,
  type TransactionDetails,
  type TransactionFormState,
  updateTransaction,
} from "@/app/_actions/transactions";
import { useDashboardDataCache } from "@/app/(authenticated)/dashboard-data-cache";
import { CategoryPicker } from "@/components/CategoryPicker";
import { DynamicIcon } from "@/components/DynamicIcon";
import { type Category, getCategoryIcon } from "@/data/categories";
import {
  formatAmountForInput,
  formatBrazilianAmountInput,
} from "@/lib/currency";

const initialState: TransactionFormState = {
  status: "idle",
  message: "",
};

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

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const fieldClassName =
  "h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-neutral-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10";

export function TransactionDetailsView({
  transaction,
}: {
  transaction: TransactionDetails;
}) {
  const router = useRouter();
  const { invalidate } = useDashboardDataCache();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(() =>
    formatAmountForInput(Math.abs(transaction.amount)),
  );
  const [selectedCategory, setSelectedCategory] = useState<Category>(() => ({
    name: transaction.category,
    icon: getCategoryIcon(transaction.category),
  }));
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updateTransaction,
    initialState,
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteTransaction,
    initialState,
  );

  useEffect(() => {
    if (updateState.status === "success") {
      invalidate();
      setIsEditing(false);
      router.refresh();
    }
  }, [invalidate, router, updateState.status]);

  useEffect(() => {
    setAmountInput(formatAmountForInput(Math.abs(transaction.amount)));
  }, [transaction.amount]);

  useEffect(() => {
    setSelectedCategory({
      name: transaction.category,
      icon: getCategoryIcon(transaction.category),
    });
  }, [transaction.category]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;

    if (isDeleteDialogOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isDeleteDialogOpen && dialog.open) {
      dialog.close();
    }
  }, [isDeleteDialogOpen]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col">
      <header className="flex h-12 items-center justify-between">
        <Link
          href="/transactions"
          aria-label="Voltar para movimentações"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:text-neutral-50"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <h1 className="text-base font-semibold text-neutral-50">Detalhes</h1>
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={transaction.isRecurring || isEditing}
          aria-label={
            transaction.isRecurring
              ? "Exclusão indisponível para movimentações recorrentes"
              : "Excluir movimentação"
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-rose-400 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-900"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </header>

      <main className="flex flex-1 flex-col pt-8">
        {isEditing ? (
          <form action={updateAction} className="space-y-5">
            <input type="hidden" name="transactionId" value={transaction.id} />
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
                    defaultChecked={transaction.transactionType === "expense"}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm font-semibold text-neutral-400 transition peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500">
                    <ArrowDownRight aria-hidden="true" className="h-4 w-4" />
                    Saída
                  </span>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="transactionType"
                    value="income"
                    defaultChecked={transaction.transactionType === "income"}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm font-semibold text-neutral-400 transition peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500">
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    Entrada
                  </span>
                </label>
              </div>
            </fieldset>

            <label className="block text-sm font-medium text-neutral-300">
              Descrição
              <input
                name="description"
                type="text"
                required
                defaultValue={transaction.name}
                className={`${fieldClassName} mt-2`}
              />
            </label>

            <label className="block text-sm font-medium text-neutral-300">
              Valor
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-neutral-500">
                  R$
                </span>
                <input
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountInput}
                  onChange={(event) =>
                    setAmountInput(
                      formatBrazilianAmountInput(event.target.value),
                    )
                  }
                  placeholder="0,00"
                  className={`${fieldClassName} pl-12`}
                />
              </span>
            </label>

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
                hasError={false}
                onOpenChange={setIsCategoryDialogOpen}
                onSelect={(category) => {
                  setSelectedCategory(category);
                  setIsCategoryDialogOpen(false);
                }}
              />
            </div>

            <label className="block text-sm font-medium text-neutral-300">
              Data
              <span className="relative mt-2 block">
                <CalendarDays
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                />
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={transaction.transactionDate}
                  className={`${fieldClassName} pl-11 [color-scheme:dark]`}
                />
              </span>
            </label>

            {updateState.message && (
              <p
                role={updateState.status === "error" ? "alert" : "status"}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  updateState.status === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                }`}
              >
                {updateState.message}
              </p>
            )}

            <div className="flex gap-3 border-t border-neutral-800 pt-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isUpdatePending}
                className="h-12 flex-1 rounded-xl border border-neutral-800 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="h-12 flex-1 rounded-xl bg-neutral-100 text-sm font-bold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatePending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <section className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300">
                <DynamicIcon
                  name={getCategoryIcon(transaction.category)}
                  className="h-7 w-7"
                />
              </div>
              <p className="mt-3 text-sm text-neutral-400">
                {transaction.name}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
                {currencyFormatter.format(transaction.amount)}
              </p>
            </section>

            <dl className="mt-8 divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
              <DetailRow
                icon={
                  transaction.transactionType === "income" ? (
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight aria-hidden="true" className="h-4 w-4" />
                  )
                }
                label="Tipo"
                value={
                  transaction.transactionType === "income" ? "Entrada" : "Saída"
                }
              />
              <DetailRow
                icon={<Tag aria-hidden="true" className="h-4 w-4" />}
                label="Categoria"
                value={transaction.category}
              />
              <DetailRow
                icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
                label={transaction.isRecurring ? "Próxima ocorrência" : "Data"}
                value={dateFormatter.format(
                  new Date(`${transaction.transactionDate}T00:00:00Z`),
                )}
              />
              {transaction.createdAt && (
                <DetailRow
                  icon={<Clock3 aria-hidden="true" className="h-4 w-4" />}
                  label="Criado em"
                  value={dateTimeFormatter.format(
                    new Date(transaction.createdAt),
                  )}
                />
              )}
            </dl>
            {transaction.isRecurring && (
              <p className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm leading-5 text-neutral-400">
                Esta movimentação faz parte de uma recorrência. A edição e a
                exclusão de recorrentes ainda não estão disponíveis.
              </p>
            )}
          </>
        )}
      </main>

      {!isEditing && (
        <footer className="mt-8 pb-2">
          {!transaction.isRecurring && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-white"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
              Editar lançamento
            </button>
          )}
        </footer>
      )}

      <dialog
        ref={deleteDialogRef}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-transaction-title"
        className="fixed inset-x-0 bottom-0 m-0 w-full max-w-none rounded-t-3xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-50 backdrop:bg-black/80 sm:inset-0 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-sm sm:rounded-3xl"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-700 sm:hidden"
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <h2
          id="delete-transaction-title"
          className="mt-4 text-center text-base font-bold"
        >
          Excluir lançamento?
        </h2>
        <p className="mt-1 text-center text-sm text-neutral-500">
          Essa ação não pode ser desfeita.
        </p>
        {deleteState.status === "error" && (
          <p role="alert" className="mt-4 text-center text-sm text-rose-300">
            {deleteState.message}
          </p>
        )}
        <form action={deleteAction} onSubmit={() => invalidate()}>
          <input type="hidden" name="transactionId" value={transaction.id} />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletePending}
              className="h-12 rounded-2xl border border-neutral-800 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDeletePending}
              className="h-12 rounded-2xl bg-rose-500 text-sm font-bold text-neutral-950 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletePending ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[3.75rem] items-center justify-between gap-3 px-4">
      <dt className="flex min-w-0 items-center gap-3 text-sm text-neutral-500">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-neutral-100">
        {value}
      </dd>
    </div>
  );
}
