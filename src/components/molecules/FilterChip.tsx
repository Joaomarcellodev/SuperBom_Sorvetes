import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-control px-4 text-label-lg transition-colors",
        active ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant hover:text-on-surface",
      )}
    >
      {children}
    </button>
  );
}
