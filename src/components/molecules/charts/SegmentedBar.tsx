import { DataTable } from "./DataTable";

export interface Segment {
  id: string;
  label: string;
  value: number;
  /** cor da parte (paleta validada) */
  color: string;
  /** cor do texto dentro da parte: escuro em fundo claro, branco em fundo escuro */
  ink: "dark" | "light";
}

/**
 * Um todo dividido em partes (ex.: mix de produtos). Larguras proporcionais, 2px de respiro
 * entre as partes, porcentagem escrita dentro quando cabe. A legenda nomeia as partes na mesma ordem.
 */
export function SegmentedBar({ segments, format, label }: { segments: Segment[]; format: (v: number) => string; label: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return <p className="py-4 text-center text-body-sm text-on-surface-variant">Sem vendas no período.</p>;
  const pct = (v: number) => Math.round((v / total) * 100);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={`${label}: ${visible.map((s) => `${s.label} ${format(s.value)} (${pct(s.value)}%)`).join(", ")}`}
        className="flex h-7 gap-[2px]"
      >
        {visible.map((s) => (
          <div
            key={s.id}
            title={`${s.label}: ${format(s.value)} (${pct(s.value)}%)`}
            className="flex min-w-[6px] items-center rounded-[4px] px-2"
            style={{ flexGrow: s.value, flexBasis: 0, backgroundColor: s.color }}
          >
            {pct(s.value) >= 12 && (
              <span className={s.ink === "dark" ? "text-label-sm text-[#0b0b0b]" : "text-label-sm text-white"}>{pct(s.value)}%</span>
            )}
          </div>
        ))}
      </div>
      <ul className="grid gap-2">
        {segments.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 text-label-lg">
            <span className="flex min-w-0 items-center gap-2 text-on-surface">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 text-label-md text-on-surface">
              <span className="tabular">{format(s.value)}</span>
              <span className="ml-1.5 text-on-surface-variant">{pct(s.value)}%</span>
            </span>
          </li>
        ))}
      </ul>
      <DataTable head={["Produto", "Pacotes", "Participação"]} rows={segments.map((s) => [s.label, format(s.value), `${pct(s.value)}%`])} />
    </div>
  );
}
