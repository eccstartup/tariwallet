import { useEffect, useState } from "react";
import { useAuthMethod, useAuth } from "@/hooks/useAuth";
import { getToken } from "@/services/jsonrpc";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: authMethod, isLoading, error } = useAuthMethod();
  const { mutate: login, isPending, error: loginError } = useAuth();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (authMethod && !getToken() && !isPending) {
      login();
    }
  }, [authMethod, login, isPending]);

  // Allow bypassing auth in demo mode
  if (showDemo) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error || loginError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 max-w-md text-center space-y-4">
          <div className="text-4xl">🔌</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Wallet Daemon Not Available
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Unable to connect to the Tari wallet daemon at{" "}
            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {import.meta.env.VITE_DAEMON_URL || "http://localhost:5100"}
            </code>
            .
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-400">
            Start the wallet daemon with{" "}
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              tari_ootle_walletd --network esme
            </code>{" "}
            or explore the wallet UI in demo mode.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => login()}
              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!getToken() && isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        <p className="text-sm text-gray-400 dark:text-gray-400">Connecting to wallet daemon...</p>
      </div>
    );
  }

  return <>{children}</>;
}
