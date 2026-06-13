import { useWalletStore } from "@/stores/walletStore";

interface BalanceCardProps {
  symbol: string;
  name: string;
  balance: string;
  address: string;
}

export function BalanceCard({ symbol, name, balance, address }: BalanceCardProps) {
  const { showBalance, toggleBalanceVisibility } = useWalletStore();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Balance
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {showBalance ? balance : "••••••"}
            </h2>
            <span className="text-lg text-purple-400 font-semibold">
              {symbol || name}
            </span>
          </div>
        </div>
        <button
          onClick={toggleBalanceVisibility}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? "👁" : "👁‍🗨"}
        </button>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={address}>
          {address}
        </p>
      </div>
    </div>
  );
}
