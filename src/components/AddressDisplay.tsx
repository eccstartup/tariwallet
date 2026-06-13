import { useState } from "react";

interface AddressDisplayProps {
  address: string;
  label?: string;
  showCopy?: boolean;
}

export function AddressDisplay({
  address,
  label,
  showCopy = true,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 break-all">
          {address}
        </code>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
