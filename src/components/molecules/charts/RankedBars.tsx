import { DataTable } from "./DataTable";

export interface RankedRow {
  id: string;
  label: string;
  value: number;
}

/**
 * Barras horizontais ordenadas (produto, rota, vendedor, categoria). Uma série = uma cor só.
 * Valor e participação ficam escritos ao lado de cada barra.
 */
export function RankedBars({
  rows,
  format,
  color = "var(--color-viz-1)",
  limit = 6,
  emptyText = "Sem dados no período.",
}: {
  rows: RankedRow[];
  format: (value: number) => string;
  color?: string;
  /** além disso, o resto vira "Outros" */
  limit?: number;
  emptyText?: string;
}) {
  const sorted = rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, r) => acc + r.value, 0);
  if (total <= 0) return <p className="py-4 text-center text-body-sm text-on-surface-variant">{emptyText}</p>;

  const shown = sorted.length > limit ? [...sorted.slice(0, limit - 1), { id: "_others", label: "Outros", value: sorted.slice(limit - 1).reduce((a, r) => a + r.value, 0) }] : sorted;
  const top = shown[0]?.value ?? 1;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {shown.map((r) => (
          <li key={r.id} title={`${r.label}: ${format(r.value)} (${pct(r.value)})`}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-label-lg text-on-surface">{r.label}</span>
              <span className="shrink-0 text-label-md text-on-surface">
                <span className="tabular">{format(r.value)}</span>
                <span className="ml-1.5 text-on-surface-variant">{pct(r.value)}</span>
              </span>
            </div>
            <div className="h-2 rounded-r-[4px] bg-surface-container-lowest" aria-hidden>
              <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(2, (r.value / top) * 100)}%`, backgroundColor: color }} />
            </div>
          </li>
        ))}
      </ul>
      <DataTable head={["Item", "Valor", "Participação"]} rows={shown.map((r) => [r.label, format(r.value), pct(r.value)])} />
    </div>
  );
}
