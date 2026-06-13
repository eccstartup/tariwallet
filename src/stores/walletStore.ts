import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  showBalance: boolean;
  theme: "light" | "dark";
  daemonUrl: string;
  toggleBalanceVisibility: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setDaemonUrl: (url: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      showBalance: true,
      theme: "dark",
      daemonUrl: import.meta.env.VITE_DAEMON_URL || "http://localhost:5100",
      toggleBalanceVisibility: () =>
        set((s) => ({ showBalance: !s.showBalance })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setDaemonUrl: (url) => set({ daemonUrl: url }),
    }),
    {
      name: "tariswap-wallet",
      partialize: (state) => ({
        theme: state.theme,
        daemonUrl: state.daemonUrl,
      }),
    },
  ),
);
