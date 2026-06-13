import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccountBalances, useAccountsGetDefault } from "@/hooks/useAccounts";
import { accountsTransfer } from "@/services/api";

export function Send() {
  const { account: paramAccount } = useParams<{ account?: string }>();
  const navigate = useNavigate();
  const { data: defaultAcct } = useAccountsGetDefault();
  const account = paramAccount || defaultAcct?.account?.component_address;
  const { data: balancesData } = useAccountBalances(account);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [resourceAddress, setResourceAddress] = useState("");
  const [maxFee, setMaxFee] = useState("1000");
  const [sending, setSending] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balances = balancesData?.balances || [];
  const selectedBalance = resourceAddress
    ? balances.find((b) => b.resource_address === resourceAddress)
    : balances.find((b) => b.resource_type !== "NonFungible") || balances[0];

  const divisibility = selectedBalance?.divisibility ?? 6;
  const unitLabel = selectedBalance?.token_symbol || "TARI";
  const rawToDisplay = (raw: string, div: number) => (Number(raw) / Math.pow(10, div)).toLocaleString(undefined, { maximumFractionDigits: div });

  const handleSend = async () => {
    if (!account || !recipient || !amount) return;
    setSending(true); setError(null);
    try {
      // Convert user-friendly amount to raw units
      const rawAmount = String(Math.round(Number(amount) * Math.pow(10, divisibility)));
      const resp = await accountsTransfer({
        account: { ComponentAddress: account },
        amount: rawAmount,
        resource_address: resourceAddress || selectedBalance?.resource_address || "",
        destination_public_key: recipient,
        max_fee: Number(maxFee),
        dry_run: false,
      });
      setTxId(resp.transaction_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally { setSending(false); }
  };

  if (txId) return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Transaction Submitted</h2>
        <p className="text-sm text-gray-400 font-mono break-all mb-4">{txId}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setTxId(null); setRecipient(""); setAmount(""); }}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg">Send Another</button>
          <button onClick={() => navigate(`/transaction/${txId}`)}
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg">View</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send</h1>
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-5 space-y-5">
        {!account ? <p className="text-sm text-gray-400">No account.</p> : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">{account}</p>
            {balances.filter(b => b.resource_type !== "NonFungible").length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-300">Asset</label>
                <select value={resourceAddress || selectedBalance?.resource_address || ""}
                  onChange={(e) => setResourceAddress(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                  {balances.filter(b => b.resource_type !== "NonFungible").map((b) => (
                    <option key={b.resource_address} value={b.resource_address}>
                      {b.token_symbol || b.resource_type} — {rawToDisplay(b.balance, b.divisibility)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-300">Recipient Public Key (hex)</label>
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="Paste recipient's public key (64 hex chars)"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-300">Amount ({unitLabel})</label>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-300">Max Fee (µTARI)</label>
              <input type="number" value={maxFee} onChange={(e) => setMaxFee(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={handleSend} disabled={sending || !account || !recipient || !amount}
              className="w-full py-3 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
              {sending ? "Sending..." : "Send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
