import { notFound } from "next/navigation";
import { getTransactionDetails } from "@/app/_actions/transactions";
import { TransactionDetailsView } from "./transaction-details-view";

export default async function TransactionDetailsPage({
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
