import { useState } from "react";
import { useAccountsList, useAccountsCreate, useAccountsRename, useAccountsSetDefault } from "@/hooks/useAccounts";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { Link, useNavigate } from "react-router-dom";

export function Accounts() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAccountsList();
  const createAccount = useAccountsCreate();
  const renameAccount = useAccountsRename();
  const setDefault = useAccountsSetDefault();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const accounts = data?.accounts || [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createAccount.mutateAsync({ account_name: newName });
    setNewName("");
    setShowCreate(false);
  };

  const handleRename = async (address: string) => {
    if (!renameValue.trim()) return;
    await renameAccount.mutateAsync({ account: address, name: renameValue });
    setRenamingId(null);
    setRenameValue("");
  };

  if (isLoading) return <LoadingSpinner text="Loading accounts..." />;
  if (error) return <ErrorDisplay message="Failed to load accounts" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          + New Account
        </button>
      </div>

      {/* Create Account */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Create New Account</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Account name"
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={createAccount.isPending}
              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              {createAccount.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon="◎"
          title="No Accounts"
          description="Create your first account to start using the wallet."
          action={{ label: "Create Account", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.account.component_address}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-colors ${
                acc.account.is_default
                  ? "border-purple-300 dark:border-purple-700"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {renamingId === acc.account.component_address ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(acc.account.component_address);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(acc.account.component_address)}
                          className="text-xs text-purple-500"
                        >
                          Save
                        </button>
                        <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {acc.account.name}
                      </h3>
                    )}
                    {acc.account.is_default && (
                      <span className="px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-500 rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                    {acc.account.component_address}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!acc.account.is_default && (
                    <button
                      onClick={async () => {
                        await setDefault.mutateAsync(acc.account.component_address);
                        navigate("/");
                      }}
                      className="px-2.5 py-1.5 text-xs text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      Switch
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRenamingId(acc.account.component_address);
                      setRenameValue(acc.account.name);
                    }}
                    className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Rename
                  </button>
                  <Link
                    to={`/accounts/${acc.account.component_address}`}
                    className="px-3 py-1.5 text-xs font-medium text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
