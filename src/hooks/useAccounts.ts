import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accountsList,
  accountsGet,
  accountsGetDefault,
  accountsGetBalances,
  accountsCreate,
  accountsRename,
  accountsSetDefault,
} from "@/services/api";
import type {
  AccountsCreateRequest,
  BalanceEntry,
} from "@/services/types";

export function useAccountsList() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsList(0, 50),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useAccountsGetDefault() {
  return useQuery({
    queryKey: ["accounts", "default"],
    queryFn: accountsGetDefault,
    retry: false,
  });
}

export function useAccountDetail(address: string | undefined) {
  return useQuery({
    queryKey: ["accounts", address],
    queryFn: () => accountsGet(address!),
    enabled: !!address,
  });
}

export function useAccountBalances(address: string | undefined | null) {
  return useQuery({
    queryKey: ["accounts", address, "balances"],
    queryFn: () => accountsGetBalances(address!, false),
    enabled: !!address,
    refetchInterval: 10_000,
  });
}

export function useAccountsCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AccountsCreateRequest) => accountsCreate(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAccountsRename() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ account, name }: { account: string; name: string }) =>
      accountsRename(account, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAccountsSetDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account: string) => accountsSetDefault(account),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
