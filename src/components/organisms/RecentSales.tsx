"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { ButtonLink } from "../atoms/ButtonLink";
import { Card } from "../atoms/Card";
import { Skeleton } from "../atoms/Skeleton";
import { EmptyState } from "../molecules/EmptyState";
import { SaleRow } from "../molecules/SaleRow";
import { SectionHeader } from "../molecules/SectionHeader";
import { usePrices, useRoutes, useSales, useSellers } from "@/hooks/useData";
import { priceMap, saleAmount } from "@/lib/finance";
import { formatMoney } from "@/lib/money";

export function RecentSales({ limit = 5 }: { limit?: number }) {
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const prices = usePrices();
  const defaults = priceMap(prices);
  const routeName = (id: string) => routes?.find((r) => r.id === id)?.name ?? "Rota removida";

  return (
    <section className="space-y-2" aria-label="Últimas vendas">
      <SectionHeader
        title="Últimas vendas"
        aside={
          <Link href="/historico" className="inline-flex items-center gap-0.5 font-bold hover:underline">
            Ver todas <ChevronRight className="size-4" />
          </Link>
        }
      />
      {sales === undefined ? (
        <Skeleton className="h-40" />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Nenhuma venda ainda"
          description="Registre a primeira venda do dia. Funciona mesmo sem internet."
          action={<ButtonLink href="/registrar" size="sm">Registrar venda</ButtonLink>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-white/[0.06]">
            {sales.slice(0, limit).map((sale) => {
              const value = saleAmount(sale, defaults);
              return (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  routeName={routeName(sale.routeId)}
                  seller={sellers?.find((s) => s.id === sale.sellerId)}
                  amount={value > 0 ? formatMoney(value) : ""}
                />
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );
}
