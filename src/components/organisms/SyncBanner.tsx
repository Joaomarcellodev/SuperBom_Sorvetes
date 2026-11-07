"use client";

import type { ReactNode } from "react";
import { CloudOff, CloudUpload, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "../atoms/Button";
import { cn } from "@/lib/format";
import { useSync } from "@/providers/SyncProvider";

/**
 * Aviso compacto no topo do painel. Só aparece quando há algo a fazer:
 * vendas esperando envio, erro de sincronização ou Supabase não configurado.
 * Tudo em dia = nada na tela (o cabeçalho já mostra "Online").
 */
export function SyncBanner() {
  const { configured, online, syncing, error, pending, syncNow } = useSync();
  const waiting = pending.sales + pending.other;

  if (!configured) {
    return (
      <Strip tone="error" icon={<TriangleAlert />} title="Supabase não configurado">
        As vendas ficam só neste aparelho. Preencha o .env.local para sincronizar.
      </Strip>
    );
  }
  if (error) {
    return (
      <Strip tone="error" icon={<TriangleAlert />} title="Falha ao sincronizar" action={online ? () => void syncNow() : undefined} busy={syncing}>
        {error}
      </Strip>
    );
  }
  if (waiting === 0) return null;

  return (
    <Strip
      tone="pending"
      icon={online ? <CloudUpload /> : <CloudOff />}
      title={`${pending.sales} ${pending.sales === 1 ? "registro" : "registros"} no aparelho`}
      action={online ? () => void syncNow() : undefined}
      busy={syncing}
    >
      {online
        ? `${pending.packages} ${pending.packages === 1 ? "pacote aguardando" : "pacotes aguardando"} envio.`
        : "Sem internet. O envio é automático ao reconectar."}
    </Strip>
  );
}

function Strip({
  tone,
  icon,
  title,
  children,
  action,
  busy,
}: {
  tone: "pending" | "error";
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: () => void;
  busy?: boolean;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-3 rounded-card border-l-4 p-3",
        tone === "error" ? "border-error bg-error-container/25" : "border-primary-container bg-surface-container",
      )}
    >
      <span className={cn("shrink-0 [&_svg]:size-5", tone === "error" ? "text-error" : "text-primary-container")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-label-lg text-on-surface">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{children}</p>
      </div>
      {action && (
        <Button size="sm" variant={tone === "error" ? "soft" : "primary"} loading={busy} icon={<RefreshCw className="size-4" />} onClick={action} className="shrink-0">
          Enviar
        </Button>
      )}
    </div>
  );
}
