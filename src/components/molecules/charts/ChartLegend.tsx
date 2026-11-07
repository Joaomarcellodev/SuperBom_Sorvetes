export interface ChartSeries {
  name: string;
  /** cor da marca (as cores de --color-viz-*) */
  color: string;
}

/** Legenda: a cor fica só no quadradinho; o texto usa a cor de texto normal. */
export function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <span aria-hidden className="size-2.5 rounded-[2px]" style={{ backgroundColor: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}
