"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { ButtonLink } from "../atoms/ButtonLink";
import { Skeleton } from "../atoms/Skeleton";
import { EmptyState } from "../molecules/EmptyState";
import { SaleListItem } from "../molecules/SaleListItem";
import { SectionHeader } from "../molecules/SectionHeader";
import { useRoutes, useSales, useSellers } from "@/hooks/useData";
import { useSession } from "@/providers/SessionProvider";

export function RecentSales() {
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const { seller } = useSession();

  const routeName = (id: string) => routes?.find((r) => r.id === id)?.name ?? "Rota removida";
  const sellerName = (id: string) => sellers?.find((s) => s.id === id)?.name ?? "—";

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
        <Skeleton className="h-28" />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Nenhuma venda ainda"
          description="Registre a primeira venda do dia. Funciona mesmo sem internet."
          action={
            <ButtonLink href="/registrar" size="sm">Registrar venda</ButtonLink>
          }
        />
      ) : (
        sales.slice(0, 3).map((sale) => (
          <SaleListItem
            key={sale.id}
            sale={sale}
            routeName={routeName(sale.routeId)}
            sellerName={sellerName(sale.sellerId)}
            isMine={sale.sellerId === seller?.id}
          />
        ))
      )}
    </section>
  );
}
