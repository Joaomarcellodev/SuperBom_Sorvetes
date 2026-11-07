"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PageHeading } from "@/components/molecules/PageHeading";
import { FilterBar, type Period } from "@/components/organisms/FilterBar";
import { SalesHistoryList } from "@/components/organisms/SalesHistoryList";
import { useRoutes, useSales, useSellers } from "@/hooks/useData";
import { addDays, startOfMonth, todayStr } from "@/lib/format";
import { deleteSale } from "@/lib/repo";
import type { Sale } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

function periodStart(period: Period): string {
  const today = todayStr();
  if (period === "today") return today;
  if (period === "7d") return addDays(today, -6);
  if (period === "month") return startOfMonth(today);
  return "";
}

export default function HistoryPage() {
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const { seller } = useSession();
  const { syncNow } = useSync();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>("7d");
  const [routeId, setRouteId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [toDelete, setToDelete] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const from = periodStart(period);
    return (sales ?? []).filter(
      (s) => s.saleDate >= from && (!routeId || s.routeId === routeId) && (!sellerId || s.sellerId === sellerId),
    );
  }, [sales, period, routeId, sellerId]);

  const packages = filtered.reduce((acc, s) => acc + s.total, 0);

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
        description={sales ? `${packages} ${packages === 1 ? "pacote" : "pacotes"} em ${filtered.length} ${filtered.length === 1 ? "venda" : "vendas"}` : undefined}
      />
      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        routes={routes ?? []}
        routeId={routeId}
        onRouteChange={setRouteId}
        sellers={sellers ?? []}
        sellerId={sellerId}
        onSellerChange={setSellerId}
      />
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
          onDelete={setToDelete}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        danger
        title="Apagar esta venda?"
        description={
          toDelete
            ? `${toDelete.total} ${toDelete.total === 1 ? "pacote" : "pacotes"}${toDelete.pointName ? ` em ${toDelete.pointName}` : ""}. A venda some do histórico e dos totais dos dois aparelhos.`
            : ""
        }
        confirmLabel="Apagar venda"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
