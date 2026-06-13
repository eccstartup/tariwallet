import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/services/queryClient";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Accounts } from "@/pages/Accounts";
import { AccountDetail } from "@/pages/AccountDetail";
import { Send } from "@/pages/Send";
import { Receive } from "@/pages/Receive";
import { Transactions } from "@/pages/Transactions";
import { TransactionDetail } from "@/pages/TransactionDetail";
import { Templates } from "@/pages/Templates";
import { Settings } from "@/pages/Settings";
import { useWalletStore } from "@/stores/walletStore";
import { useEffect } from "react";

function AppInner() {
  const theme = useWalletStore((s) => s.theme);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="send" element={<Send />} />
            <Route path="send/:account" element={<Send />} />
            <Route path="receive" element={<Receive />} />
            <Route path="receive/:account" element={<Receive />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:account" element={<Transactions />} />
            <Route path="transaction/:id" element={<TransactionDetail />} />
            <Route path="templates" element={<Templates />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}

export default function App() {
  return <QueryClientProvider client={queryClient}><AppInner /></QueryClientProvider>;
}
