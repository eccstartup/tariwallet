import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useWalletStore } from "@/stores/walletStore";

export function Layout() {
  const theme = useWalletStore((s) => s.theme);

  return (
    <div className={`flex h-screen ${theme}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
