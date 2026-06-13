import { useQuery } from "@tanstack/react-query";
import { transactionsList, transactionsGet, transactionsGetResult } from "@/services/api";
import type { TransactionStatus } from "@/services/types";

export function useTransactionsList(
  account?: string | null,
  status?: TransactionStatus | null,
  limit = 20,
) {
  return useQuery({
    queryKey: ["transactions", account, status, limit],
    queryFn: () =>
      transactionsList({
        account: account || null,
        status,
        limit,
        offset: 0,
      }),
    refetchInterval: 10_000,
  });
}

export function useTransactionDetail(transactionId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", transactionId],
    queryFn: () => transactionsGet(transactionId!),
    enabled: !!transactionId,
  });
}

export function useTransactionResult(transactionId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", transactionId, "result"],
    queryFn: () => transactionsGetResult(transactionId!),
    enabled: !!transactionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data?.result?.status &&
        ["Pending", "Accepted"].includes(data.result.status)
      ) {
        return 3000;
      }
      return false;
    },
  });
}
