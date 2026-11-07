"use client";

import { Badge } from "../atoms/Badge";
import { Card } from "../atoms/Card";
import { ProductIcon, productTextColor } from "../atoms/ProductIcon";
import { SectionHeader } from "../molecules/SectionHeader";
import { cn } from "@/lib/format";
import type { DashboardStats } from "@/lib/stats";

export function ProductBreakdown({ rows }: { rows: DashboardStats["byProductToday"] }) {
  return (
    <section className="space-y-2" aria-label="Desempenho por linha">
      <SectionHeader title="Desempenho por linha" aside={<span className="text-on-surface-variant">hoje</span>} />
      {rows.map((row) => (
        <Card key={row.id} className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <ProductIcon id={row.id} />
            <div className="min-w-0">
              <p className="truncate font-display text-headline-sm">{row.name}</p>
              <p className={cn("text-label-md font-bold", productTextColor[row.id])}>
                {row.packages} {row.packages === 1 ? "pacote" : "pacotes"} hoje
              </p>
            </div>
          </div>
          <Badge tone="neutral">{row.share}% do total</Badge>
        </Card>
      ))}
    </section>
  );
}
