"use client";

import { CloudCheck, CloudOff, CloudUpload, RefreshCw, TriangleAlert } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { StatusDot } from "../atoms/StatusDot";
import { formatSyncMoment } from "@/lib/format";
import { useSync } from "@/providers/SyncProvider";

/** Cartão do topo da tela inicial: diz com clareza se há vendas esperando para subir. */
export function SyncBanner() {
  const { configured, online, syncing, justSynced, error, lastSyncAt, pending, syncNow } = useSync();
  const waiting = pending.sales + pending.other;

  if (!configured) {
    return (
      <Card className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-error/15 text-error">
          <TriangleAlert className="size-5" />
        </span>
        <div>
          <p className="text-label-lg text-error">Supabase não configurado</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            As vendas ficam salvas só neste aparelho. Preencha o <code>.env.local</code> para sincronizar com o sócio.
          </p>
        </div>
      </Card>
    );
  }

  const Icon = !online ? CloudOff : waiting > 0 ? CloudUpload : CloudCheck;

  return (
    <Card className="relative overflow-hidden">
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-container/20 text-primary-container">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {waiting > 0 ? (
                <Badge tone="primary" uppercase>
                  <StatusDot tone="primary" pulse size="sm" />
                  {pending.sales} {pending.sales === 1 ? "venda local" : "vendas locais"}
                </Badge>
              ) : (
                <Badge tone="secondary" uppercase>
                  <StatusDot tone="secondary" size="sm" />
                  {justSynced ? "Concluído!" : "Tudo em dia"}
                </Badge>
              )}
              <Badge tone="neutral">{online ? "Dispositivo seguro" : "Sem internet"}</Badge>
            </div>
            <p className="mt-1 text-body-sm leading-snug text-on-surface">
              {waiting > 0
                ? online
                  ? `${pending.packages} ${pending.packages === 1 ? "pacote aguardando" : "pacotes aguardando"} envio para o servidor.`
                  : `${pending.packages} ${pending.packages === 1 ? "pacote salvo" : "pacotes salvos"} no aparelho. Envio automático ao reconectar.`
                : lastSyncAt
                  ? `Última sincronização: ${formatSyncMoment(lastSyncAt)}.`
                  : "Ainda não sincronizou com o servidor."}
            </p>
            {error && <p role="alert" className="mt-1 text-body-sm text-error">{error}</p>}
          </div>
        </div>
        <Button
          size="sm"
          variant={waiting > 0 ? "primary" : "soft"}
          onClick={() => void syncNow()}
          loading={syncing}
          disabled={!online}
          icon={<RefreshCw className="size-[18px]" />}
          className="shrink-0"
        >
          Sincronizar
        </Button>
      </div>
    </Card>
  );
}
