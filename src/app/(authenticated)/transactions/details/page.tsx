import { notFound } from "next/navigation";
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
  if (typeof id !== "string") notFound();

  const transaction = await getTransactionDetails(id);
  if (!transaction) notFound();

  return <TransactionDetailsView transaction={transaction} />;
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
