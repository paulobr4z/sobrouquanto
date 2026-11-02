import { TransactionsList } from "./transactions-list";

type TransactionType = "expense" | "income";

function isTransactionType(
  value: string | string[] | undefined,
): value is TransactionType {
  return value === "expense" || value === "income";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string | string[];
    created?: string | string[];
  }>;
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
