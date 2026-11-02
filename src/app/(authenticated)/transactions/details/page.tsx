import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getTransactionDetails } from "@/app/_actions/transactions";
import { TransactionDetailsView } from "./transaction-details-view";

export default function TransactionDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<TransactionDetailsFallback />}>
      <TransactionDetailsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TransactionDetailsContent({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  if (typeof id !== "string") return <TransactionNotFound />;

  const transaction = await getTransactionDetails(id);
  if (!transaction) return <TransactionNotFound />;

  return <TransactionDetailsView transaction={transaction} />;
}

function TransactionNotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300">
        <CircleAlert aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-neutral-50">
        Movimentação não encontrada
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        Não encontramos essa movimentação. Ela pode ter sido excluída ou o link
        pode estar incorreto.
      </p>
      <Link
        href="/transactions"
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Voltar para movimentações
      </Link>
    </main>
  );
}

function TransactionDetailsFallback() {
  return (
    <output
      className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col"
      aria-busy="true"
      aria-label="Carregando detalhes da movimentação"
    >
      <div className="h-12 animate-pulse rounded-full bg-neutral-900" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-neutral-900" />
    </output>
  );
}
