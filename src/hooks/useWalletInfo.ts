import { useQuery } from "@tanstack/react-query";
import { walletGetInfo } from "@/services/api";

export function useWalletInfo() {
  return useQuery({
    queryKey: ["wallet", "info"],
    queryFn: walletGetInfo,
    staleTime: 60_000,
  });
}
