import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** Bloco que abre e fecha (usa <details>, funciona sem JavaScript). */
export function Disclosure({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-3xl bg-surface-container shadow-card">
      <summary className="flex min-h-14 list-none items-center justify-between gap-2 p-4 select-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-container-high text-primary [&_svg]:size-[18px]">{icon}</span>
          <span className="text-label-lg text-on-surface">{title}</span>
        </span>
        <ChevronDown aria-hidden className="size-5 text-on-surface-variant transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3.5 p-4 pt-0">{children}</div>
    </details>
  );
}
