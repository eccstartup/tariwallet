import { useState } from "react";

interface AccountSelectorProps {
  accounts: Array<{ address: string; name: string }>;
  selected: string | null;
  onSelect: (address: string) => void;
  label?: string;
}

export function AccountSelector({
  accounts,
  selected,
  onSelect,
  label = "Account",
}: AccountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
      >
        <option value="" disabled>
          Select account...
        </option>
        {accounts.map((acc) => (
          <option key={acc.address} value={acc.address}>
            {acc.name} ({acc.address.slice(0, 10)}...)
          </option>
        ))}
      </select>
    </div>
  );
}
