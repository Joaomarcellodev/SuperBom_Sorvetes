"use client";

import { useEffect, useState } from "react";
import { CloudCheck, Database, ListChecks, RefreshCw } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { StatusDot } from "../atoms/StatusDot";
import { InfoRow } from "../molecules/InfoRow";
import { formatBytes, formatSyncMoment } from "@/lib/format";
import { usePwa } from "@/providers/PwaProvider";
import { useSync } from "@/providers/SyncProvider";

export function SyncPanel() {
  const { configured, online, syncing, justSynced, error, lastSyncAt, pending, syncNow } = useSync();
  const { swStatus } = usePwa();
  const [storage, setStorage] = useState<string | null>(null);

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => e.usage !== undefined && setStorage(formatBytes(e.usage)))
      .catch(() => undefined);
  }, [pending.sales, lastSyncAt]);

  const swOn = swStatus === "ready";
  const waiting = pending.sales + pending.other;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-headline-sm">
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-container-high text-secondary">
            <RefreshCw className="size-5" />
          </span>
          Conexão e nuvem
        </h2>
        <Badge tone={swOn ? "secondary" : "neutral"} uppercase>
          <StatusDot tone={swOn ? "secondary" : "primary"} pulse={swOn} size="sm" />
          {swOn ? "Offline pronto" : swStatus === "disabled" ? "Só em produção" : "Offline indisponível"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <InfoRow
          icon={<CloudCheck />}
          label="Última sincronização"
          value={lastSyncAt ? formatSyncMoment(lastSyncAt) : "Nunca"}
        />
        <InfoRow
          icon={<ListChecks />}
          label="Aguardando envio"
          value={
            waiting > 0 ? (
              <span className="text-primary">
                {pending.sales} {pending.sales === 1 ? "venda" : "vendas"} ({pending.packages} pcts)
              </span>
            ) : (
              <span className="text-secondary">Nada pendente</span>
            )
          }
        />
        <InfoRow icon={<Database />} label="Armazenado no aparelho" value={storage ?? "—"} />
      </div>

      {!configured && (
        <p role="alert" className="text-body-sm text-error">Supabase não configurado: defina as variáveis no .env.local.</p>
      )}
      {error && configured && <p role="alert" className="text-body-sm text-error">{error}</p>}

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        loading={syncing}
        disabled={!online || !configured}
        icon={<RefreshCw className="size-6" />}
        onClick={() => void syncNow()}
      >
        {justSynced ? "Tudo sincronizado!" : online ? "Forçar sincronização agora" : "Sem internet"}
      </Button>
    </Card>
  );
}
