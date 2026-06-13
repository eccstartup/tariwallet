import { useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useWalletInfo } from "@/hooks/useWalletInfo";
import { useQuery } from "@tanstack/react-query";
import { settingsGet, keysList } from "@/services/api";

export function Settings() {
  const { theme, setTheme, daemonUrl, setDaemonUrl } = useWalletStore();
  const { data: walletInfo } = useWalletInfo();
  const { data: settingsData } = useQuery({ queryKey: ["settings"], queryFn: settingsGet });
  const { data: keysData } = useQuery({ queryKey: ["keys"], queryFn: keysList });
  const [editUrl, setEditUrl] = useState(daemonUrl);
  const [saved, setSaved] = useState(false);

  const handleSaveUrl = () => {
    setDaemonUrl(editUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const networkName = typeof settingsData?.network === "object" && settingsData?.network
    ? (settingsData.network as { name: string }).name
    : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-gray-900 dark:text-white">Appearance</h3>
        <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}
          className="bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Connection</h3>

        <div>
          <label className="block text-sm mb-1.5">Daemon JSON-RPC URL</label>
          <div className="flex gap-2">
            <input type="text" value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm font-mono" />
            <button onClick={handleSaveUrl}
              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Restart after changing to take effect.</p>
        </div>

        {settingsData?.indexer_url && (
          <div>
            <label className="block text-sm mb-1.5">Indexer URL (read-only)</label>
            <p className="text-sm text-gray-400 dark:text-gray-400 font-mono truncate bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              {settingsData.indexer_url}
            </p>
          </div>
        )}

        {networkName && <p className="text-sm text-gray-400 dark:text-gray-400">Network: {networkName}</p>}
      </div>

      {walletInfo && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-gray-900 dark:text-white">Wallet Daemon</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400">Network: {walletInfo.network}</p>
          <p className="text-sm text-gray-400 dark:text-gray-400">Version: {walletInfo.version}</p>
        </div>
      )}

      {keysData?.keys && keysData.keys.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-gray-900 dark:text-white">Keys ({keysData.keys.length})</h3>
          {keysData.keys.map((key, i) => (
            <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <p className="text-sm">#{i} {key?.[2] ? "✓" : ""}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{typeof key?.[1] === "string" ? key[1] : ""}</p>
            </div>
          ))}
        </div>
      )}

      {settingsData && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-gray-900 dark:text-white">Raw Settings</h3>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(settingsData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
