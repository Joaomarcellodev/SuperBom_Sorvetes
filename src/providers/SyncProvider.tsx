"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, getMeta, META_LAST_SYNC } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { syncAll } from "@/lib/sync";
import { useToast } from "./ToastProvider";

export interface PendingInfo {
  /** vendas (inclui exclusões) aguardando envio */
  sales: number;
  /** pacotes dessas vendas */
  packages: number;
  /** rotas/pontos novos aguardando envio */
  other: number;
}

interface SyncState {
  configured: boolean;
  online: boolean;
  syncing: boolean;
  /** true por alguns segundos depois de uma sincronização bem-sucedida */
  justSynced: boolean;
  error: string | null;
  lastSyncAt: string | null;
  pending: PendingInfo;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncState | null>(null);

const friendlyError = (e: unknown): string => {
  const msg = e instanceof Error ? e.message : String(e);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return "Sem conexão com o servidor. Tentaremos de novo.";
  }
  // Coluna/tabela nova que ainda não existe no Supabase.
  if (/schema cache|does not exist|PGRST20[45]|permission denied/i.test(msg)) {
    return "Banco desatualizado: rode no SQL Editor do Supabase os arquivos novos de supabase/migrations.";
  }
  return msg;
};

const records = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;

/** Aviso na tela quando o banco do aparelho e o da nuvem trocaram algo (rodada sem novidade não avisa). */
function syncNotice(sent: number, received: number): { title: string; description: string } | null {
  if (sent > 0 && received > 0) {
    return { title: "Sincronizado com a nuvem", description: `${records(sent)} enviados e ${records(received)} recebidos do sócio.` };
  }
  if (sent > 0) return { title: "Salvo na nuvem", description: `${records(sent)} deste aparelho já estão no servidor.` };
  if (received > 0) return { title: "Novidades do sócio", description: `${records(received)} recebidos da nuvem.` };
  return null;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const again = useRef(false);

  const pending = useLiveQuery<PendingInfo>(async () => {
    const db = getDb();
    const dirtySales = await db.sales.where("dirty").equals(1).toArray();
    const other = (await db.routes.where("dirty").equals(1).count()) + (await db.points.where("dirty").equals(1).count());
    return {
      sales: dirtySales.length,
      packages: dirtySales.filter((s) => !s.deletedAt).reduce((acc, s) => acc + s.total, 0),
      other,
    };
  }, []);

  const lastSyncAt = useLiveQuery(async () => (await getMeta<string>(META_LAST_SYNC)) ?? null, []);

  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase não configurado. Preencha o .env.local.");
      return;
    }
    // Offline não é erro: as vendas ficam no aparelho e a tela já mostra "Offline".
    if (navigator.onLine === false) return;
    // Se já tem uma sincronização rodando, pede uma segunda rodada em vez de perder o pedido
    // (acontece quando a venda é salva no meio de um envio).
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    setSyncing(true);
    setError(null);
    let sent = 0;
    let received = 0;
    try {
      do {
        again.current = false;
        const result = await syncAll();
        sent += result.sent;
        received += result.received;
      } while (again.current);
      const notice = syncNotice(sent, received);
      if (notice) toast({ ...notice, tone: "success" });
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [toast]);

  useEffect(() => {
    setOnline(navigator.onLine !== false);
    const goOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const goOffline = () => setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void syncNow();
    }, 120_000);
    void syncNow();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [syncNow]);

  const value = useMemo<SyncState>(
    () => ({
      configured: isSupabaseConfigured,
      online,
      syncing,
      justSynced,
      error,
      lastSyncAt: lastSyncAt ?? null,
      pending: pending ?? { sales: 0, packages: 0, other: 0 },
      syncNow,
    }),
    [online, syncing, justSynced, error, lastSyncAt, pending, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync fora do SyncProvider");
  return ctx;
}
