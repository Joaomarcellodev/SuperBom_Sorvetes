"use client";

import { useMemo } from "react";
import { PlusCircle } from "lucide-react";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { DashboardSummary } from "@/components/organisms/DashboardSummary";
import { ProductBreakdown } from "@/components/organisms/ProductBreakdown";
import { RecentSales } from "@/components/organisms/RecentSales";
import { SyncBanner } from "@/components/organisms/SyncBanner";
import { useSales } from "@/hooks/useData";
import { formatLongDate, todayStr } from "@/lib/format";
import { computeDashboardStats } from "@/lib/stats";
import { useSession } from "@/providers/SessionProvider";

export default function HomePage() {
  const { seller } = useSession();
  const sales = useSales();
  const today = todayStr();
  const stats = useMemo(() => (sales ? computeDashboardStats(sales, today) : undefined), [sales, today]);

  return (
    <>
      <SyncBanner />

      <div className="flex flex-col gap-1 pt-1">
        <span className="text-label-md uppercase text-on-surface-variant">{formatLongDate(today)}</span>
        <h1 className="font-display text-headline-xl">
          Olá, <span className="text-primary">{seller?.name.split(" ")[0]}!</span> 🍦
        </h1>
      </div>

      <ButtonLink href="/registrar" size="lg" fullWidth icon={<PlusCircle className="size-7" />} className="h-14 tracking-wide">
        REGISTRAR NOVA VENDA
      </ButtonLink>

      <DashboardSummary stats={stats} />
      {stats && <ProductBreakdown rows={stats.byProductToday} />}
      <RecentSales />
    </>
  );
}
