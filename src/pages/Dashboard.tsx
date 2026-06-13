import { useAccountsGetDefault, useAccountBalances } from "@/hooks/useAccounts";
import { useTransactionsList } from "@/hooks/useTransactions";
import { useWalletInfo } from "@/hooks/useWalletInfo";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionRow } from "@/components/TransactionRow";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { useState } from "react";
import { accountsCreateFreeTestCoins } from "@/services/api";
import { rpcRequest } from "@/services/jsonrpc";

function formatBalance(raw: string, divisibility: number = 6): string {
  const num = Number(raw) / Math.pow(10, divisibility);
  return num.toLocaleString(undefined, { minimumFractionDigits: divisibility, maximumFractionDigits: divisibility });
}

export function Dashboard() {
  const { data: defaultAccount, isLoading: loadingDefault } = useAccountsGetDefault();
  const { data: walletInfo } = useWalletInfo();

  const account = defaultAccount?.account;
  const accountAddress = account?.component_address;

  const { data: balancesData } = useAccountBalances(accountAddress);
  const { data: transactionsData } = useTransactionsList(accountAddress || null, null, 5);

  const balances = balancesData?.balances || [];
  const xtrBalance = balances.find(
    (b) => b.token_symbol === "tTARI" || b.token_symbol === "XTR" || b.resource_type === "Fungible",
  ) || balances[0];
  const transactions = transactionsData?.transactions || [];
  const [claiming, setClaiming] = useState(false);
  const [minting, setMinting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!accountAddress) return;
    setClaiming(true); setMsg(null);
    try {
      await accountsCreateFreeTestCoins({ account: { ComponentAddress: accountAddress }, max_fee: 1000 });
      setMsg("Faucet submitted!");
    } catch (err: any) { setMsg(err.message); }
    finally { setClaiming(false); }
  };

  const handleMint = async () => {
    if (!accountAddress) return;
    setMinting(true); setMsg(null);
    try {
      await rpcRequest("nfts.mint_faucet_nft", { account: { ComponentAddress: accountAddress }, number_to_mint: 1, max_fee: 1000, mutable_data: {} });
      setMsg("NFT minted!");
    } catch (err: any) { setMsg(err.message); }
    finally { setMinting(false); }
  };

  if (loadingDefault) return <LoadingSpinner text="Loading..." />;
  if (!account) return <EmptyState icon="🆕" title="No Account" description="Create one first." action={{ label: "Create Account", to: "/accounts" }} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
          {walletInfo && <p className="text-sm text-gray-500 dark:text-gray-400">{walletInfo.network} — v{walletInfo.version}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClaim} disabled={claiming || minting}
            className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
            {claiming ? "⏳" : "🚰"} Faucet
          </button>
          <button onClick={handleMint} disabled={claiming || minting}
            className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
            {minting ? "⏳" : "🖼"} Mint NFT
          </button>
        </div>
      </div>
      {msg && <p className={`text-xs ${msg.includes("Submitted") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

      <BalanceCard symbol="TARI" name="TARI" balance={formatBalance(xtrBalance?.balance || "0", xtrBalance?.divisibility ?? 6)} address={accountAddress || ""} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to={`/send/${accountAddress}`} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors"><span className="text-2xl text-gray-700 dark:text-gray-300">↑</span><span className="text-sm text-gray-700 dark:text-gray-300">Send</span></Link>
        <Link to={`/receive/${accountAddress}`} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors"><span className="text-2xl text-gray-700 dark:text-gray-300">↓</span><span className="text-sm text-gray-700 dark:text-gray-300">Receive</span></Link>
        <Link to="/accounts" className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors"><span className="text-2xl text-gray-700 dark:text-gray-300">◎</span><span className="text-sm text-gray-700 dark:text-gray-300">Accounts</span></Link>
        <Link to={`/transactions/${accountAddress}`} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors"><span className="text-2xl text-gray-700 dark:text-gray-300">↔</span><span className="text-sm text-gray-700 dark:text-gray-300">History</span></Link>
      </div>

      {balances.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Assets</h3>
          </div>
          {balances.map((b) => {
            const isNft = b.resource_type === "NonFungible";
            const symbol = b.token_symbol || b.resource_type;
            const icon = isNft ? "🖼" : "💰";
            return (
              <div key={b.resource_address} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{symbol}</p>
                      {isNft && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-400 rounded">NFT</span>}
                      {!isNft && b.divisibility > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500">1/{10 ** b.divisibility}</span>}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate max-w-[200px]">{b.resource_address}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-right flex-shrink-0">
                  {formatBalance(b.balance, b.divisibility)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <Link to={`/transactions/${accountAddress}`} className="text-sm text-purple-500">View all →</Link>
        </div>
        {transactions.length === 0
          ? <EmptyState icon="📭" title="No Transactions" description="None yet." />
          : <div className="space-y-2">{transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</div>}
      </div>
    </div>
  );
}
