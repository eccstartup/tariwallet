import { useParams } from "react-router-dom";
import { useAccountsList, useAccountsGetDefault } from "@/hooks/useAccounts";
import { AddressDisplay } from "@/components/AddressDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { QRCodeSVG } from "qrcode.react";

export function Receive() {
  const { account: paramAccount } = useParams<{ account?: string }>();
  const { data: defaultAcct } = useAccountsGetDefault();
  const { data, isLoading } = useAccountsList();
  const account = paramAccount || defaultAcct?.account?.component_address;

  if (isLoading) return <LoadingSpinner text="Loading..." />;
  if (!account) return <EmptyState icon="◎" title="No Account" description="Create one first." />;

  const accounts = data?.accounts || [];
  const current = accounts.find((a) => a.account.component_address === account);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receive</h1>
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Account: {current?.account.name || account.slice(0, 20)}</p>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl border"><QRCodeSVG value={account} size={200} level="M" /></div>
        </div>
        <AddressDisplay address={account} label="Component Address" />
        {current?.account.owner_public_key && (
          <AddressDisplay address={current.account.owner_public_key} label="Public Key (for sending)" />
        )}
        <div className="p-4 bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-400">Share this address to receive tokens on esmeralda testnet.</p>
        </div>
      </div>
    </div>
  );
}
