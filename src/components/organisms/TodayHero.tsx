"use client";

import { PlusCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { ButtonLink } from "../atoms/ButtonLink";
import { KpiStrip } from "../molecules/KpiStrip";
import { cn, formatInt, formatLongDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Seller } from "@/lib/types";

/** Topo do painel: saudação, o dia de hoje em números e o atalho para registrar venda. */
export function TodayHero({
  seller,
  today,
  packages,
  amountCents,
  count,
  deltaPackages,
}: {
  seller: Seller;
  today: string;
  packages: number;
  amountCents: number;
  count: number;
  deltaPackages: number | null;
}) {
  return (
    <section aria-label="Hoje" className="brand-hero relative overflow-hidden rounded-card p-4 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-label-sm uppercase tracking-wider text-secondary">{formatLongDate(today)}</p>
          <h1 className="mt-0.5 truncate font-display text-headline-lg text-on-surface">
            Olá, <span className="text-primary">{seller.name.split(" ")[0]}</span>
          </h1>
        </div>
        <Avatar name={seller.name} photo={seller.avatarUrl} size="lg" />
      </div>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-[48px] font-bold leading-[48px] tracking-tight text-on-surface">{formatInt(packages)}</p>
        <div className="min-w-0 pb-1">
          <p className="text-label-lg text-on-surface">{packages === 1 ? "pacote hoje" : "pacotes hoje"}</p>
          {deltaPackages !== null ? (
            <p className={cn("flex items-center gap-0.5 text-label-sm", deltaPackages >= 0 ? "text-secondary" : "text-error")}>
              {deltaPackages >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
              {deltaPackages > 0 ? "+" : ""}
              {deltaPackages}% vs ontem
            </p>
          ) : (
            <p className="text-label-sm text-on-surface-variant">sem vendas ontem para comparar</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <KpiStrip
          tone="glass"
          items={[
            { label: "Faturado", value: formatMoney(amountCents) },
            { label: "Vendas", value: formatInt(count) },
          ]}
        />
      </div>

      <ButtonLink href="/registrar" size="lg" fullWidth icon={<PlusCircle className="size-6" />} className="mt-4">
        Registrar venda
      </ButtonLink>
    </section>
  );
}
