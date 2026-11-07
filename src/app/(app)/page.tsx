"use client";

import { useMemo, useState } from "react";
import { Banknote, Package, PlusCircle, ReceiptText, Scale } from "lucide-react";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ColumnChart } from "@/components/molecules/charts/ColumnChart";
import { RankedBars } from "@/components/molecules/charts/RankedBars";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { StatTile } from "@/components/molecules/StatTile";
import { FilterBar } from "@/components/organisms/FilterBar";
import { RecentSales } from "@/components/organisms/RecentSales";
import { SyncBanner } from "@/components/organisms/SyncBanner";
import { usePrices, useRoutes, useSales, useSellers } from "@/hooks/useData";
import { defaultFilters, periodLabel } from "@/lib/filters";
import { priceMap } from "@/lib/finance";
import { formatInt, formatLongDate, todayStr } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { computeDashboard } from "@/lib/stats";
import { useSession } from "@/providers/SessionProvider";

const COMPARE: Record<string, string> = { today: "vs ontem", "7d": "vs 7 dias antes", month: "vs mês passado" };
const pkg = (n: number) => `${formatInt(n)} ${n === 1 ? "pacote" : "pacotes"}`;

export default function DashboardPage() {
  const { seller } = useSession();
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const prices = usePrices();
  const [filters, setFilters] = useState(() => defaultFilters("7d"));
  const today = todayStr();

  const d = useMemo(
    () => (sales ? computeDashboard(sales, filters, today, priceMap(prices), routes ?? [], sellers ?? []) : undefined),
    [sales, filters, today, prices, routes, sellers],
  );
  const compare = COMPARE[filters.period];

  return (
    <>
      <SyncBanner />

      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <span className="text-label-sm uppercase text-on-surface-variant">{formatLongDate(today)}</span>
          <h1 className="truncate font-display text-headline-xl">
            Olá, <span className="text-primary">{seller?.name.split(" ")[0]}</span>
          </h1>
        </div>
      </div>

      <ButtonLink href="/registrar" size="lg" fullWidth icon={<PlusCircle className="size-6" />}>
        Registrar nova venda
      </ButtonLink>

      <FilterBar value={filters} onChange={setFilters} routes={routes} sellers={sellers} />

      {!d ? (
        <div className="space-y-2">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-56" />
        </div>
      ) : (
        <>
          <section aria-label="Resumo do período" className="space-y-2">
            <StatTile
              hero
              icon={<Package />}
              label={`Pacotes vendidos · ${periodLabel(filters.period).toLowerCase()}`}
              value={formatInt(d.packages)}
              delta={d.deltaPackages}
              caption={compare ? `${compare}` : `${d.count} ${d.count === 1 ? "venda" : "vendas"} no total`}
            />
            <div className="grid grid-cols-2 gap-2">
              <StatTile icon={<Banknote />} label="Faturamento" value={formatMoney(d.amountCents)} delta={d.deltaAmount} caption={compare} />
              <StatTile icon={<ReceiptText />} label="Vendas" value={formatInt(d.count)} caption={`média ${String(d.avgPackages).replace(".", ",")} pct/venda`} />
            </div>
          </section>

          <Card className="space-y-3">
            <SectionHeader title={filters.period === "today" ? "Pacotes por hora" : d.buckets.length > 62 ? "Pacotes por mês" : "Pacotes por dia"} />
            <ColumnChart buckets={d.buckets} series={[{ name: "Pacotes", color: "var(--color-viz-1)" }]} format={pkg} formatAxis={formatInt} />
          </Card>

          <Card className="space-y-3">
            <SectionHeader title="Por produto" aside={<span className="text-on-surface-variant">pacotes</span>} />
            <RankedBars rows={d.byProduct} format={formatInt} />
          </Card>

          <Card className="space-y-3">
            <SectionHeader title="Por rota" aside={<span className="text-on-surface-variant">pacotes</span>} />
            <RankedBars rows={d.byRoute} format={formatInt} />
          </Card>

          {(sellers?.length ?? 0) > 1 && (
            <Card className="space-y-3">
              <SectionHeader title="Por vendedor" aside={<Scale className="size-4 text-on-surface-variant" />} />
              <RankedBars rows={d.bySeller} format={formatInt} />
            </Card>
          )}
        </>
      )}

      <RecentSales />
    </>
  );
}
