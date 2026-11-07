import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export interface SellerOption {
  id: string;
  label: string;
  icon: ReactNode;
}

/** Chave segmentada de 48px: "Eu" / "Sócio". */
export function SellerToggle({
  options,
  value,
  onChange,
}: {
  options: SellerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Quem vendeu" className="flex gap-1 rounded-control bg-surface-container-lowest p-1">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-chip px-2 text-label-lg transition-all duration-200 [&_svg]:size-5 [&_svg]:shrink-0",
              active
                ? "bg-primary-container text-on-primary-container shadow-glow-primary"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
