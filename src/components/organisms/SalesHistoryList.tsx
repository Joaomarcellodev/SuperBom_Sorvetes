"use client";

import { ReceiptText } from "lucide-react";
import { EmptyState } from "../molecules/EmptyState";
import { SaleListItem } from "../molecules/SaleListItem";
import { formatDayLabel } from "@/lib/format";
import { groupByDay } from "@/lib/stats";
import type { Route, Sale, Seller } from "@/lib/types";

export function SalesHistoryList({
  sales,
  routes,
  sellers,
  currentSellerId,
  onDelete,
}: {
  sales: Sale[];
  routes: Route[];
  sellers: Seller[];
  currentSellerId: string | undefined;
  onDelete: (sale: Sale) => void;
}) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText />}
        title="Nenhuma venda encontrada"
        description="Ajuste os filtros ou registre uma nova venda."
      />
    );
  }

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? "Rota removida";
  const sellerName = (id: string) => sellers.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      {groupByDay(sales).map((day) => (
        <section key={day.date} aria-label={formatDayLabel(day.date)} className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-display text-headline-sm">{formatDayLabel(day.date)}</h2>
            <span className="text-label-md font-bold text-primary">
              {day.total} {day.total === 1 ? "pacote" : "pacotes"}
            </span>
          </div>
          {day.sales.map((sale) => (
            <SaleListItem
              key={sale.id}
              sale={sale}
              timeStyle="clock"
              routeName={routeName(sale.routeId)}
              sellerName={sellerName(sale.sellerId)}
              isMine={sale.sellerId === currentSellerId}
              onDelete={() => onDelete(sale)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
