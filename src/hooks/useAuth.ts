import { useMutation, useQuery } from "@tanstack/react-query";
import { authGetMethod, authLogin } from "@/services/api";
import { setToken, getToken, isAuthenticated } from "@/services/jsonrpc";
import { queryClient } from "@/services/queryClient";

export function useAuthMethod() {
  return useQuery({
    queryKey: ["auth", "method"],
    queryFn: authGetMethod,
    staleTime: Infinity,
  });
}

export function useAuth() {
  return useMutation({
    mutationFn: async () => {
      const resp = await authLogin(["Admin"]);
      setToken(resp.token);
      return resp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useAuthStatus() {
  return getToken() !== null;
}
