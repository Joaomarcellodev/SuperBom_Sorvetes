"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { ReceivePaymentModal } from "./ReceivePaymentModal";
import { usePrices, useSales } from "@/hooks/useData";
import { priceMap, saleAmount } from "@/lib/finance";
import { formatDayLabel } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { isOpenDebt, paymentMethodLabel } from "@/lib/payment";
import { describeItems } from "@/lib/products";
import { settleSale } from "@/lib/repo";
import type { Sale } from "@/lib/types";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Quem levou e ainda não pagou nesta rota: aparece ao escolher a rota, para cobrar na passada seguinte. */
export function PendingPayments({ routeId }: { routeId: string }) {
  const sales = useSales();
  const prices = usePrices();
  const { syncNow } = useSync();
  const { toast } = useToast();
  const [receiving, setReceiving] = useState<Sale | null>(null);

  const defaults = priceMap(prices);
  const open = (sales ?? []).filter((s) => s.routeId === routeId && isOpenDebt(s)).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (open.length === 0) return null;

  const total = open.reduce((acc, s) => acc + saleAmount(s, defaults), 0);

  const confirm = async (method: Parameters<typeof settleSale>[1]) => {
    if (!receiving) return;
    const sale = receiving;
    setReceiving(null);
    await settleSale(sale.id, method);
    toast({ title: "Pendência recebida", description: `${sale.pointName || "Cliente"} pagou ${formatMoney(saleAmount(sale, defaults))} (${paymentMethodLabel(method)}).` });
    void syncNow();
  };

  return (
    <Card className="space-y-3" aria-label="Pendências desta rota">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-headline-sm">
          <HandCoins className="size-5 text-primary" /> Pendências da rota
        </h2>
        <Badge tone="danger">
          {open.length} · {formatMoney(total)}
        </Badge>
      </div>
      <ul className="divide-y divide-white/5">
        {open.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-lg text-on-surface">{s.pointName || "Cliente sem nome"}</p>
              <p className="truncate text-body-sm text-on-surface-variant">
                {formatDayLabel(s.saleDate)} · {describeItems(s.items)}
              </p>
              <p className="tabular text-label-lg text-error">{formatMoney(saleAmount(s, defaults))}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReceiving(s)}>
              Receber
            </Button>
          </li>
        ))}
      </ul>
      <ReceivePaymentModal
        open={receiving !== null}
        title={receiving?.pointName || "Cliente sem nome"}
        details={receiving ? `${formatDayLabel(receiving.saleDate)} · ${describeItems(receiving.items)}` : ""}
        amountCents={receiving ? saleAmount(receiving, defaults) : 0}
        onConfirm={(m) => void confirm(m)}
        onClose={() => setReceiving(null)}
      />
    </Card>
  );
}
