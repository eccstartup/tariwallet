import { useParams, Link } from "react-router-dom";
import { useTransactionDetail, useTransactionResult } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";

function formatDate(dateStr: string): string {
  const s = dateStr.replace(" ", "T").replace(/\..*/, "") + "Z";
  const d = new Date(s);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: txData, isLoading } = useTransactionDetail(id);
  const { data: resultData } = useTransactionResult(id);

  if (isLoading) return <LoadingSpinner text="Loading transaction..." />;
  if (!txData || !id) {
    return <ErrorDisplay message="Transaction not found" />;
  }

  const status = txData.status;
  const result = resultData?.result;

  const statusColors: Record<string, string> = {
    Pending: "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10",
    Accepted: "text-green-500 bg-green-50 dark:bg-green-500/10",
    Rejected: "text-red-500 bg-red-50 dark:bg-red-500/10",
    Invalid: "text-gray-500 bg-gray-50 dark:bg-gray-500/10",
    OnlyFeeAccepted: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
    DryRun: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/transactions"
          className="text-sm text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ← Transactions
        </Link>
        <span className="text-gray-400 dark:text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">
          {id.slice(0, 12)}...{id.slice(-8)}
        </h1>
      </div>

      {/* Status + Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Transaction Details</h3>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mb-1">Transaction ID</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{id}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mb-1">Status</p>
            <span
              className={`inline-block px-2.5 py-1 rounded-lg text-sm font-medium ${statusColors[status] || statusColors.Pending}`}
            >
              {status}
            </span>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mb-1">Last Updated</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDate(txData.last_update_time)}
            </p>
          </div>

          {txData.final_fee && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-400 mb-1">Final Fee</p>
              <p className="text-sm text-gray-900 dark:text-white">{txData.final_fee} µTARI</p>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Execution Result</h3>
          {result ? (
            <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-400">
              {status === "Pending" ? "Waiting for execution..." : "No result available"}
            </p>
          )}
        </div>
      </div>

      {/* Raw Transaction */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Raw Transaction</h3>
        <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-80">
          {JSON.stringify(txData.transaction, null, 2)}
        </pre>
      </div>
    </div>
  );
}
