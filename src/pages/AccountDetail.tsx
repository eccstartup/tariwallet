import { useParams, Link } from "react-router-dom";
import { useAccountDetail, useAccountBalances } from "@/hooks/useAccounts";
import { useTransactionsList } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { AddressDisplay } from "@/components/AddressDisplay";
import { TransactionRow } from "@/components/TransactionRow";
import { EmptyState } from "@/components/EmptyState";

function formatBalance(raw: string, divisibility: number = 6): string {
  const num = Number(raw) / Math.pow(10, divisibility);
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: divisibility });
}

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: accountData, isLoading: loadingAccount } = useAccountDetail(id);
  const { data: balancesData, isLoading: loadingBalances } = useAccountBalances(id);
  const { data: txsData, isLoading: loadingTxs } = useTransactionsList(id, null, 10);

  if (loadingAccount) return <LoadingSpinner text="Loading account..." />;
  if (!accountData?.account || !id) {
    return <ErrorDisplay message="Account not found" />;
  }

  const account = accountData.account;
  const balances = balancesData?.balances || [];
  const transactions = txsData?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/accounts" className="text-sm text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← Accounts
        </Link>
        <span className="text-gray-400 dark:text-gray-400">/</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
        {account.is_default && (
          <span className="px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-500 rounded font-medium">
            Default
          </span>
        )}
      </div>

      {/* Account Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Account Info</h3>
          <AddressDisplay address={account.component_address} label="Component Address" />
          <AddressDisplay address={account.owner_public_key} label="Public Key" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</p>
            <p className="text-sm text-gray-900 dark:text-white font-mono truncate">{account.address}</p>
          </div>
        </div>

        {/* Balances */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Balances</h3>
          {loadingBalances ? (
            <LoadingSpinner text="Loading balances..." />
          ) : balances.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-400">No assets found</p>
          ) : (
            <div className="space-y-3">
              {balances.map((b) => (
                <div key={b.resource_address} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {b.token_symbol || b.resource_type}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 truncate max-w-[150px]">{b.resource_address}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatBalance(b.balance, b.divisibility)} {b.token_symbol || b.resource_type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Transactions</h3>
        {loadingTxs ? (
          <LoadingSpinner text="Loading transactions..." />
        ) : transactions.length === 0 ? (
          <EmptyState icon="📭" title="No Transactions" description="No transactions found for this account." />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
