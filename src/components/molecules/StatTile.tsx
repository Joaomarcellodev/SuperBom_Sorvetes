import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../atoms/Card";
import { cn } from "@/lib/format";

/**
 * Número de destaque: rótulo, valor e (opcional) variação contra o período anterior.
 * `upIsGood=false` inverte a cor da variação (ex.: gastos subindo é ruim).
 */
export function StatTile({
  icon,
  label,
  value,
  caption,
  delta,
  upIsGood = true,
  hero,
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  caption?: string;
  /** variação em %, null = sem base de comparação */
  delta?: number | null;
  upIsGood?: boolean;
  hero?: boolean;
  className?: string;
}) {
  const good = delta !== undefined && delta !== null && (delta === 0 || delta > 0 === upIsGood);
  return (
    <Card tone={hero ? "base" : "raised"} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-on-surface-variant [&_svg]:size-4 [&_svg]:shrink-0">
          {icon}
          <span className="truncate text-label-sm uppercase">{label}</span>
        </span>
        {delta !== undefined && delta !== null && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-chip px-1.5 py-0.5 text-label-sm",
              good ? "bg-secondary/15 text-secondary" : "bg-error-container/40 text-error",
            )}
          >
            {delta >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <span className={cn("truncate font-body font-bold tracking-tight text-on-surface", hero ? "text-[44px] leading-[48px]" : "text-[24px] leading-[30px]")}>
        {value}
      </span>
      {caption && <span className="truncate text-body-sm text-on-surface-variant">{caption}</span>}
    </Card>
  );
}
