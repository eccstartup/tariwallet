import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { transactionsList } from "@/services/api";
import { useAccountsGetDefault } from "@/hooks/useAccounts";
import { TransactionRow } from "@/components/TransactionRow";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";

export function Transactions() {
  const { account: paramAccount } = useParams<{ account?: string }>();
  const { data: defaultAcct } = useAccountsGetDefault();
  const account = paramAccount || defaultAcct?.account?.component_address;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions", account],
    queryFn: () => transactionsList({ account: account!, limit: 200, offset: 0 }),
    enabled: !!account,
    refetchInterval: 10_000,
  });

  const transactions = data?.transactions || [];

  if (!account) return <EmptyState icon="◎" title="No Account" description="Select an account first." />;
  if (isLoading) return <LoadingSpinner text="Loading..." />;
  if (error) return <ErrorDisplay message="Failed to load transactions" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
      <p className="text-sm text-gray-400 font-mono truncate">{account}</p>
      {transactions.length === 0
        ? <EmptyState icon="📭" title="No Transactions" description="No transactions for this account." />
        : <div className="space-y-2">{transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</div>}
    </div>
  );
}
