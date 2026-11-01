import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { NewTransactionForm } from "./new-transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <Link
          href="/transactions"
          className="flex w-fit items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-neutral-100"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Voltar para movimentações
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
            Nova movimentação
          </h1>
          <p className="mt-1 text-sm text-neutral-400 sm:text-base">
            Preencha os detalhes para organizar suas finanças.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <NewTransactionForm />

        <aside className="h-fit rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <CalendarDays aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-neutral-100">
            Um passo de cada vez
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Registrar suas movimentações ajuda a entender para onde seu dinheiro
            está indo e a acompanhar seu orçamento.
          </p>
          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Dica
            </p>
            <p className="mt-1 text-sm leading-5 text-neutral-300">
              Escolha uma categoria para manter seus gastos organizados.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
