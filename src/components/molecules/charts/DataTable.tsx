import { ChevronDown } from "lucide-react";

/** Os mesmos números do gráfico em tabela (quem não enxerga bem as cores ou prefere ler). */
export function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;
  return (
    <details className="group">
      <summary className="inline-flex list-none items-center gap-1 text-label-md text-secondary select-none [&::-webkit-details-marker]:hidden">
        Ver dados
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-control bg-surface-container-low">
        <table className="w-full text-body-sm">
          <thead className="sticky top-0 bg-surface-container-low">
            <tr>
              {head.map((h, i) => (
                <th key={h} scope="col" className={i === 0 ? "px-3 py-2 text-left text-label-sm text-on-surface-variant" : "px-3 py-2 text-right text-label-sm text-on-surface-variant"}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.join("|")} className="border-t border-white/5">
                {r.map((c, i) => (
                  <td key={i} className={i === 0 ? "px-3 py-1.5 text-on-surface" : "tabular px-3 py-1.5 text-right text-on-surface"}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
