"use client";

import { CalendarDays, CalendarRange, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Card } from "../atoms/Card";
import { Skeleton } from "../atoms/Skeleton";
import { SectionHeader } from "../molecules/SectionHeader";
import { StatCard } from "../molecules/StatCard";
import { formatInt } from "@/lib/format";
import type { DashboardStats } from "@/lib/stats";

export function DashboardSummary({ stats }: { stats: DashboardStats | undefined }) {
  if (!stats) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-36" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const delta = stats.deltaVsYesterday;
  return (
    <section className="space-y-2" aria-label="Volume em pacotes">
      <SectionHeader title="Volume em pacotes" />
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-md font-bold uppercase text-on-surface-variant">Total de hoje</span>
          {delta !== null ? (
            <Badge tone={delta >= 0 ? "secondary" : "danger"}>
              {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {delta > 0 ? "+" : ""}
              {delta}% vs ontem
            </Badge>
          ) : (
            <Badge>Ontem: {formatInt(stats.yesterday)}</Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tabular font-display text-metric-lg text-primary">{formatInt(stats.today)}</span>
          <span className="text-label-lg font-semibold uppercase text-on-surface-variant">
            {stats.today === 1 ? "pacote vendido" : "pacotes vendidos"}
          </span>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<CalendarRange />} label="Esta semana" value={stats.week} caption="pacotes vendidos" />
        <StatCard icon={<CalendarDays />} label="Este mês" value={stats.month} caption="pacotes vendidos" accent />
      </div>
    </section>
  );
}
