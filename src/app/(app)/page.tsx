"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/atoms/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ColumnChart } from "@/components/molecules/charts/ColumnChart";
import { RankedBars } from "@/components/molecules/charts/RankedBars";
import { SegmentedBar } from "@/components/molecules/charts/SegmentedBar";
import { KpiStrip } from "@/components/molecules/KpiStrip";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { FilterBar } from "@/components/organisms/FilterBar";
import { RecentSales } from "@/components/organisms/RecentSales";
import { SyncBanner } from "@/components/organisms/SyncBanner";
import { TodayHero } from "@/components/organisms/TodayHero";
import { usePrices, useRoutes, useSales, useSellers } from "@/hooks/useData";
import { defaultFilters } from "@/lib/filters";
import { priceMap } from "@/lib/finance";
import { formatInt, todayStr } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { computeDashboard } from "@/lib/stats";
import { useSession } from "@/providers/SessionProvider";

const COMPARE: Record<string, string> = { today: "vs ontem", "7d": "vs 7 dias antes", month: "vs mês passado" };
const PRODUCT_COLOR: Record<string, string> = {
  simples: "var(--color-product-simples)",
  cobertura: "var(--color-product-cobertura)",
  cremosinho: "var(--color-product-cremosinho)",
};
const pkg = (n: number) => `${formatInt(n)} ${n === 1 ? "pacote" : "pacotes"}`;

export default function DashboardPage() {
  const { seller } = useSession();
  const sales = useSales();
  const routes = useRoutes();
  const sellers = useSellers();
  const prices = usePrices();
  const [filters, setFilters] = useState(() => defaultFilters("7d"));
  const today = todayStr();

  const data = useMemo(() => {
    if (!sales) return undefined;
    const defaults = priceMap(prices);
    return {
      today: computeDashboard(sales, defaultFilters("today"), today, defaults, routes ?? [], sellers ?? []),
      period: computeDashboard(sales, filters, today, defaults, routes ?? [], sellers ?? []),
    };
  }, [sales, filters, today, prices, routes, sellers]);

  if (!seller) return null;
  const d = data?.period;
  const compare = COMPARE[filters.period];

  return (
    <>
      <SyncBanner />

      {data ? (
        <TodayHero
          seller={seller}
          today={today}
          packages={data.today.packages}
          amountCents={data.today.amountCents}
          count={data.today.count}
          deltaPackages={data.today.deltaPackages}
        />
      ) : (
        <Skeleton className="h-64" />
      )}

      <section aria-label="Desempenho" className="space-y-3 pt-2">
        <SectionHeader title="Desempenho" />
        <FilterBar value={filters} onChange={setFilters} routes={routes} sellers={sellers} />

        {!d ? (
          <Skeleton className="h-72" />
        ) : (
          <>
            <KpiStrip
              items={[
                { label: "Pacotes", value: formatInt(d.packages), delta: d.deltaPackages, hint: compare ?? `${d.count} vendas` },
                { label: "Faturamento", value: formatMoney(d.amountCents), delta: d.deltaAmount, hint: compare },
              ]}
            />

            <Card className="space-y-3">
              <SectionHeader
                title={filters.period === "today" ? "Pacotes por hora" : d.buckets[0]?.key.length === 7 ? "Pacotes por mês" : "Pacotes por dia"}
                aside={<span className="whitespace-nowrap text-on-surface-variant">{d.count} {d.count === 1 ? "venda" : "vendas"}</span>}
              />
              {d.count > 0 && (
                <p className="-mt-1 px-1 text-body-sm text-on-surface-variant">
                  Média de {String(d.avgPackages).replace(".", ",")} pacotes por venda
                </p>
              )}
              <ColumnChart buckets={d.buckets} series={[{ name: "Pacotes", color: "var(--color-viz-1)" }]} format={pkg} formatAxis={formatInt} />
            </Card>

            <Card className="space-y-3">
              <SectionHeader title="Mix de produtos" aside={<span className="text-on-surface-variant">pacotes</span>} />
              <SegmentedBar
                label="Mix de produtos"
                format={formatInt}
                segments={d.byProduct.map((p) => ({ ...p, color: PRODUCT_COLOR[p.id] ?? "var(--color-viz-1)", ink: "dark" as const }))}
              />
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="space-y-3">
                <SectionHeader title="Rotas" aside={<span className="text-on-surface-variant">pacotes</span>} />
                <RankedBars rows={d.byRoute} format={formatInt} />
              </Card>
              {(sellers?.length ?? 0) > 1 && (
                <Card className="space-y-3">
                  <SectionHeader title="Vendedores" aside={<span className="text-on-surface-variant">pacotes</span>} />
                  <RankedBars
                    rows={d.bySeller.map((r) => {
                      const s = sellers?.find((x) => x.id === r.id);
                      return { ...r, leading: <Avatar name={r.label} photo={s?.avatarUrl} size="sm" className="size-6 text-[10px]" /> };
                    })}
                    format={formatInt}
                  />
                </Card>
              )}
            </div>
          </>
        )}
      </section>

      <RecentSales />
    </>
  );
}
