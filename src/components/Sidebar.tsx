import { NavLink, useLocation } from "react-router-dom";
import { useWalletStore } from "@/stores/walletStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/accounts", label: "Accounts", icon: "◎" },
  { to: "/send", label: "Send", icon: "↑" },
  { to: "/receive", label: "Receive", icon: "↓" },
  { to: "/transactions", label: "Transactions", icon: "↔" },
  { to: "/templates", label: "Templates", icon: "⊡" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800 flex items-center gap-3">
        <img src="/tari-logo.png" alt="Tari" className="h-8 w-8" />
        <div>
          <h1 className="text-xl font-bold text-purple-400 tracking-tight">TariWallet</h1>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Testnet Wallet</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`
            }
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useWalletStore();

  return (
    <button
      onClick={() => toggleTheme()}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
    >
      <span>{theme === "dark" ? "☀" : "☾"}</span>
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
