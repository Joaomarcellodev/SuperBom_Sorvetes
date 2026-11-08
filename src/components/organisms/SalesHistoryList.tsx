"use client";

import { ReceiptText } from "lucide-react";
import { EmptyState } from "../molecules/EmptyState";
import { Button } from "../atoms/Button";
import { SaleListItem } from "../molecules/SaleListItem";
import { ReceiptButton } from "./ReceiptButton";
import { isOpenDebt } from "@/lib/payment";
import { saleAmount } from "@/lib/finance";
import { formatDayLabel } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { groupByDay } from "@/lib/stats";
import type { ProductId, Route, Sale, Seller } from "@/lib/types";

export function SalesHistoryList({
  sales,
  routes,
  sellers,
  currentSellerId,
  defaults,
  onDelete,
  onReceive,
}: {
  sales: Sale[];
  routes: Route[];
  sellers: Seller[];
  currentSellerId: string | undefined;
  /** preço padrão, para valorar vendas antigas sem preço próprio */
  defaults: Record<ProductId, number>;
  onDelete: (sale: Sale) => void;
  /** quitar uma pendência */
  onReceive: (sale: Sale) => void;
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
            <span className="tabular text-label-md font-bold text-primary">
              {day.total} {day.total === 1 ? "pacote" : "pacotes"} · {formatMoney(day.sales.reduce((acc, s) => acc + saleAmount(s, defaults), 0))}
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
              amount={formatMoney(saleAmount(sale, defaults))}
              actions={
                <>
                  {isOpenDebt(sale) && (
                    <Button size="sm" variant="outline" onClick={() => onReceive(sale)}>
                      Receber
                    </Button>
                  )}
                  <ReceiptButton
                    sale={sale}
                    variant="ghost"
                    info={{ routeName: routeName(sale.routeId), sellerName: sellerName(sale.sellerId), defaults }}
                  />
                </>
              }
              onDelete={() => onDelete(sale)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
