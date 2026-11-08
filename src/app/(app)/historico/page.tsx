"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PageHeading } from "@/components/molecules/PageHeading";
import { FilterBar } from "@/components/organisms/FilterBar";
import { SalesHistoryList } from "@/components/organisms/SalesHistoryList";
import { usePrices, useRoutes, useSales, useSellers } from "@/hooks/useData";
import { priceMap, saleAmount } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { defaultFilters, matchesFilters } from "@/lib/filters";
import { todayStr } from "@/lib/format";
import { deleteSale } from "@/lib/repo";
import type { Sale } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

export default function HistoryPage() {
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const prices = usePrices();
  const { seller } = useSession();
  const { syncNow } = useSync();
  const { toast } = useToast();

  const [filters, setFilters] = useState(defaultFilters);
  const [toDelete, setToDelete] = useState<Sale | null>(null);

  const today = todayStr();
  const filtered = useMemo(
    () => (sales ?? []).filter((s) => matchesFilters({ date: s.saleDate, routeId: s.routeId, sellerId: s.sellerId }, filters, today)),
    [sales, filters, today],
  );

  const defaults = priceMap(prices);
  const packages = filtered.reduce((acc, s) => acc + s.total, 0);
  const amount = filtered.reduce((acc, s) => acc + saleAmount(s, defaults), 0);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    await deleteSale(id);
    toast({ title: "Venda apagada", description: "A exclusão também chega ao aparelho do sócio.", tone: "offline" });
    void syncNow();
  };

  return (
    <>
      <PageHeading
        title="Histórico"
        description={
          sales
            ? `${packages} ${packages === 1 ? "pacote" : "pacotes"} em ${filtered.length} ${filtered.length === 1 ? "venda" : "vendas"} · ${formatMoney(amount)}`
            : undefined
        }
      />
      <FilterBar value={filters} onChange={setFilters} routes={routes} sellers={sellers} />
      {sales === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <SalesHistoryList
          sales={filtered}
          routes={routes ?? []}
          sellers={sellers ?? []}
          currentSellerId={seller?.id}
          defaults={defaults}
          onDelete={setToDelete}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        danger
        title="Apagar esta venda?"
        details={
          toDelete
            ? `${toDelete.total} ${toDelete.total === 1 ? "pacote" : "pacotes"}${toDelete.pointName ? ` · ${toDelete.pointName}` : ""}`
            : null
        }
        description="Some do histórico e dos totais nos dois aparelhos."
        confirmLabel="Apagar"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
