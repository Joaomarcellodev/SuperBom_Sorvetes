"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSellers } from "@/hooks/useData";
import { verifyPin } from "@/lib/pin";
import type { Seller } from "@/lib/types";

const KEY = "superbom.session";

interface SessionState {
  /** false até ler o storage e carregar os perfis do banco local */
  ready: boolean;
  seller: Seller | null;
  sellers: Seller[];
  login: (sellerId: string, pin: string, keep: boolean) => Promise<boolean>;
  logout: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

function readStoredId(): string | null {
  try {
    return localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const sellers = useSellers();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [storageRead, setStorageRead] = useState(false);

  useEffect(() => {
    setSellerId(readStoredId());
    setStorageRead(true);
  }, []);

  const login = useCallback(
    async (id: string, pin: string, keep: boolean) => {
      const target = sellers?.find((s) => s.id === id);
      if (!target) return false;
      // A conferência é local: por isso o login funciona sem internet.
      if (!(await verifyPin(pin, target.pinHash))) return false;
      try {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
        (keep ? localStorage : sessionStorage).setItem(KEY, id);
      } catch {
        /* storage bloqueado: a sessão vale até fechar a aba */
      }
      setSellerId(id);
      return true;
    },
    [sellers],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setSellerId(null);
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      ready: storageRead && sellers !== undefined,
      seller: sellers?.find((s) => s.id === sellerId) ?? null,
      sellers: sellers ?? [],
      login,
      logout,
    }),
    [storageRead, sellers, sellerId, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession fora do SessionProvider");
  return ctx;
}
