import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/format";

export interface Kpi {
  label: string;
  value: string;
  /** variação em %; null/undefined = sem base de comparação */
  delta?: number | null;
  upIsGood?: boolean;
  hint?: string;
}

/** Indicadores lado a lado numa faixa só, separados por linhas finas (sem caixas soltas). */
export function KpiStrip({ items, tone = "card" }: { items: Kpi[]; tone?: "card" | "glass" }) {
  return (
    <dl
      className={cn(
        "grid divide-x divide-white/[0.08] rounded-control py-3",
        tone === "card" ? "bg-surface-container ring-1 ring-inset ring-white/[0.04]" : "bg-black/20 ring-1 ring-inset ring-white/[0.06]",
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((k) => {
        const hasDelta = k.delta !== undefined && k.delta !== null;
        const good = hasDelta && (k.delta === 0 || (k.delta! > 0) === (k.upIsGood ?? true));
        return (
          <div key={k.label} className="flex min-w-0 flex-col gap-0.5 px-3">
            <dt className="truncate text-label-sm uppercase text-on-surface-variant">{k.label}</dt>
            <dd className="truncate text-[20px] font-bold leading-7 tracking-tight text-on-surface">{k.value}</dd>
            {hasDelta ? (
              <dd className={cn("flex items-center gap-0.5 text-label-sm", good ? "text-secondary" : "text-error")}>
                {k.delta! >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                {k.delta! > 0 ? "+" : ""}
                {k.delta}%{k.hint ? <span className="ml-1 truncate text-on-surface-variant">{k.hint}</span> : null}
              </dd>
            ) : (
              k.hint && <dd className="truncate text-label-sm text-on-surface-variant">{k.hint}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
