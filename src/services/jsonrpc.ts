// JSON-RPC 2.0 client for Tari Wallet Daemon
// Uses relative path — Vite proxies /json_rpc to the wallet daemon

const JSON_RPC_URL = "/json_rpc";

let token: string | null = null;
let requestId = 0;

export function setToken(t: string | null) {
  token = t;
}

export function getToken(): string | null {
  return token;
}

export function isAuthenticated(): boolean {
  return Boolean(token);
}

export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

export class RpcException extends Error {
  code: number;
  data?: unknown;
  constructor(error: RpcError) {
    super(`RPC Error ${error.code}: ${error.message}`);
    this.code = error.code;
    this.data = error.data;
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof RpcException && error.code === 401;
}

export async function rpcRequest<T = unknown>(
  method: string,
  params: object = {},
): Promise<T> {
  const id = requestId++;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(JSON_RPC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    }, (_, v) => typeof v === "bigint" ? Number(v) : v),
  });

  if (!response.ok) {
    throw new RpcException({
      code: response.status,
      message: `HTTP ${response.status}: ${response.statusText}`,
    });
  }

  const body = await response.json();

  if (body.error) {
    // try token refresh on 401
    if (body.error.code === 401 && !method.startsWith("auth.")) {
      try {
        await refreshOrReauth();
        // retry once with new token
        return rpcRequest<T>(method, params);
      } catch {
        token = null;
        throw new RpcException(body.error);
      }
    }
    throw new RpcException(body.error);
  }

  return body.result as T;
}

async function refreshOrReauth(): Promise<void> {
  // try refresh first
  const refreshResp = await fetch(JSON_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: requestId++, method: "auth.refresh", params: {} }),
  });
  const refreshBody = await refreshResp.json();
  if (!refreshBody.error) {
    token = refreshBody.result.token;
    return;
  }
  // refresh failed, do full re-auth
  const authResp = await fetch(JSON_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: requestId++, method: "auth.request", params: { permissions: ["Admin"], credentials: "None" } }),
  });
  const authBody = await authResp.json();
  if (authBody.error) throw new RpcException(authBody.error);
  token = authBody.result.token;
}
