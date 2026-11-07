"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import { niceScale, type Bucket } from "@/lib/series";
import { ChartLegend, type ChartSeries } from "./ChartLegend";
import { DataTable } from "./DataTable";

const PLOT_HEIGHT = 150;

/**
 * Colunas verticais por dia/hora/mês, uma ou duas séries na MESMA unidade (um eixo só).
 * Toque ou passe o mouse numa coluna para ver os valores; "Ver dados" mostra a tabela.
 */
export function ColumnChart({
  buckets,
  series,
  format,
  formatAxis = format,
  emptyText = "Sem movimento no período.",
}: {
  buckets: Bucket[];
  series: ChartSeries[];
  format: (value: number) => string;
  formatAxis?: (value: number) => string;
  emptyText?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const peak = Math.max(0, ...buckets.flatMap((b) => b.values));
  const { max, ticks } = niceScale(peak);
  const every = Math.ceil(buckets.length / 7);
  const current = active !== null ? buckets[active] : undefined;

  if (peak <= 0) {
    return <p className="flex h-24 items-center justify-center rounded-control bg-surface-container-low text-body-sm text-on-surface-variant">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {series.length > 1 && <ChartLegend series={series} />}

      <div className="relative flex gap-2" onPointerLeave={() => setActive(null)}>
        {/* eixo Y */}
        <div className="relative w-12 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="tabular absolute right-0 -translate-y-1/2 text-[10px] leading-none text-on-surface-variant"
              style={{ bottom: `${(t / max) * 100}%` }}
            >
              {formatAxis(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* grade */}
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: PLOT_HEIGHT }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="absolute inset-x-0 h-px bg-viz-grid" style={{ bottom: `${(t / max) * 100}%` }} />
            ))}
          </div>

          {/* colunas: cada dia é um botão da altura toda (alvo de toque grande) */}
          <div className="relative flex items-end" style={{ height: PLOT_HEIGHT }} role="group" aria-label="Gráfico de colunas">
            {buckets.map((b, i) => (
              <button
                key={b.key}
                type="button"
                aria-label={`${b.title}: ${series.map((s, k) => `${s.name} ${format(b.values[k] ?? 0)}`).join(", ")}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((a) => (a === i ? null : i))}
                className={cn(
                  "flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] px-[1px] outline-none transition-colors",
                  active === i && "bg-white/[0.04]",
                )}
              >
                {series.map((s, k) => {
                  const v = b.values[k] ?? 0;
                  return (
                    <span
                      key={s.name}
                      className={cn("w-full max-w-6 rounded-t-[4px] transition-opacity", active !== null && active !== i && "opacity-60")}
                      style={{ height: v > 0 ? `max(2px, ${(v / max) * 100}%)` : 0, backgroundColor: s.color }}
                    />
                  );
                })}
              </button>
            ))}
          </div>

          {/* eixo X */}
          <div className="mt-1.5 flex" aria-hidden>
            {buckets.map((b, i) => (
              <span key={b.key} className="min-w-0 flex-1 truncate text-center text-[10px] leading-none text-on-surface-variant">
                {i % every === 0 ? b.label : ""}
              </span>
            ))}
          </div>

          {/* tooltip */}
          {current && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 min-w-32 rounded-control bg-surface-container-highest px-3 py-2 shadow-card ring-1 ring-white/10"
              style={{
                left: `${((active + 0.5) / buckets.length) * 100}%`,
                transform: `translateX(${active < buckets.length / 3 ? "-10%" : active > (buckets.length * 2) / 3 ? "-90%" : "-50%"})`,
              }}
            >
              <p className="text-label-sm text-on-surface-variant">{current.title}</p>
              {series.map((s, k) => (
                <p key={s.name} className="mt-1 flex items-center gap-2">
                  <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="tabular text-label-lg text-on-surface">{format(current.values[k] ?? 0)}</span>
                  {series.length > 1 && <span className="text-body-sm text-on-surface-variant">{s.name}</span>}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <DataTable
        head={["Período", ...series.map((s) => s.name)]}
        rows={buckets.filter((b) => b.values.some((v) => v > 0)).map((b) => [b.title, ...b.values.map(format)])}
      />
    </div>
  );
}
