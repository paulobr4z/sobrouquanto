import { Suspense } from "react";
import { TransactionsList } from "./transactions-list";

type TransactionType = "expense" | "income";

type TransactionsSearchParams = Promise<{
  type?: string | string[];
  created?: string | string[];
}>;

function isTransactionType(
  value: string | string[] | undefined,
): value is TransactionType {
  return value === "expense" || value === "income";
}

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: TransactionsSearchParams;
}) {
  return (
    <Suspense fallback={<TransactionsLoading />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: TransactionsSearchParams;
}) {
  const { type, created } = await searchParams;
  const initialType = isTransactionType(type) ? type : "expense";
  const initialSuccessType = isTransactionType(created) ? created : null;

  return (
    <TransactionsList
      initialType={initialType}
      initialSuccessType={initialSuccessType}
    />
  );
}

function TransactionsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl">
        Movimentações
      </h1>
      <output aria-live="polite" className="text-sm text-neutral-500">
        Carregando movimentações...
      </output>
    </div>
  );
}
