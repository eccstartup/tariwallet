import { Link } from "react-router-dom";
import type { TransactionInfo } from "@/services/types";

function formatDate(dateStr: string): string {
  // Parse "2026-06-13 07:40:36.0" -> Date (treat as UTC)
  const s = dateStr.replace(" ", "T").replace(/\..*/, "") + "Z";
  const d = new Date(s);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}

interface TransactionRowProps {
  tx: TransactionInfo;
}

const statusColors: Record<string, string> = {
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Accepted:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Invalid: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  OnlyFeeAccepted:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  DryRun: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export function TransactionRow({ tx }: TransactionRowProps) {
  const shortId = `${tx.id.slice(0, 8)}...${tx.id.slice(-6)}`;

  return (
    <Link
      to={`/transaction/${tx.id}`}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[tx.status] || statusColors.Pending}`}
        >
          {tx.status}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
          {shortId}
        </span>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-400 shrink-0 ml-3">
        {formatDate(tx.last_update_time)}
      </div>
    </Link>
  );
}
