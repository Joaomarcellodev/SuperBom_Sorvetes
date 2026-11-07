"use client";

import { useState } from "react";
import { ChevronRight, Download, FileSpreadsheet, FolderArchive, MessageCircle, Eraser, Send } from "lucide-react";
import { Card } from "../atoms/Card";
import { ConfirmDialog } from "../molecules/ConfirmDialog";
import { SettingsRow } from "../molecules/SettingsRow";
import { useRoutes, useSales, useSellers } from "@/hooks/useData";
import { buildDailySummary, buildSalesCsv, downloadTextFile } from "@/lib/export";
import { addDays, todayStr } from "@/lib/format";
import { purgeSyncedBefore } from "@/lib/repo";
import { useToast } from "@/providers/ToastProvider";

const KEEP_DAYS = 90;

export function DataTools() {
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const { toast } = useToast();
  const [confirmPurge, setConfirmPurge] = useState(false);

  const empty = !sales || sales.length === 0;

  const exportCsv = () => {
    if (!sales || !routes || !sellers) return;
    downloadTextFile(`maxbono-vendas-${todayStr()}.csv`, buildSalesCsv(sales, routes, sellers), "text/csv");
    toast({ title: "Planilha gerada", description: "O arquivo CSV abre direto no Excel." });
  };

  const shareWhatsapp = () => {
    if (!sales || !routes) return;
    const text = buildDailySummary(todayStr(), sales, routes);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const purge = async () => {
    setConfirmPurge(false);
    const removed = await purgeSyncedBefore(addDays(todayStr(), -KEEP_DAYS));
    toast({
      title: removed > 0 ? "Histórico antigo removido" : "Nada para remover",
      description: removed > 0 ? `${removed} vendas antigas saíram do aparelho (continuam no servidor).` : "Não há vendas sincronizadas com mais de 90 dias.",
    });
  };

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="mb-1 flex items-center gap-2 font-display text-headline-sm">
        <FolderArchive className="size-5 text-primary" /> Dados e relatórios
      </h2>
      <SettingsRow
        icon={<FileSpreadsheet />}
        title="Exportar para Excel / CSV"
        subtitle="Todas as vendas, uma por linha"
        trailing={<Download />}
        onClick={exportCsv}
        disabled={empty}
      />
      <SettingsRow
        icon={<MessageCircle />}
        title="Compartilhar no WhatsApp"
        subtitle="Resumo de fechamento de hoje"
        trailing={<Send className="text-secondary" />}
        onClick={shareWhatsapp}
        disabled={empty}
      />
      <SettingsRow
        icon={<Eraser />}
        tone="danger"
        title="Limpar histórico antigo"
        subtitle={`Só do aparelho, só já sincronizado, com mais de ${KEEP_DAYS} dias`}
        trailing={<ChevronRight />}
        onClick={() => setConfirmPurge(true)}
        disabled={empty}
      />
      <ConfirmDialog
        open={confirmPurge}
        danger
        title="Limpar histórico antigo?"
        description={`Remove deste aparelho as vendas com mais de ${KEEP_DAYS} dias que já foram enviadas ao servidor. Elas continuam salvas no Supabase.`}
        confirmLabel="Limpar"
        onConfirm={() => void purge()}
        onCancel={() => setConfirmPurge(false)}
      />
    </Card>
  );
}
