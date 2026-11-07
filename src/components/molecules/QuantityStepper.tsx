import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/format";
import { tick } from "@/lib/feedback";
import { IconButton } from "../atoms/IconButton";

const MAX = 9999;

export function QuantityStepper({
  value,
  onChange,
  label,
  unit = "PACOTES",
}: {
  value: number;
  onChange: (next: number) => void;
  /** nome do produto, para leitor de tela */
  label: string;
  unit?: string;
}) {
  const set = (next: number) => {
    const clamped = Math.min(MAX, Math.max(0, next));
    if (clamped !== value) {
      tick();
      onChange(clamped);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-control bg-surface-container-lowest p-2">
      <IconButton size="lg" label={`Diminuir ${label}`} onClick={() => set(value - 1)} disabled={value === 0}>
        <Minus className="size-7" />
      </IconButton>
      <div className="flex flex-col items-center px-4" aria-live="polite">
        <span className={cn("tabular font-display text-metric", value > 0 ? "text-primary" : "text-on-surface")}>{value}</span>
        <span className="mt-1 text-label-sm text-on-surface-variant">{unit}</span>
      </div>
      <IconButton size="lg" tone="primary" label={`Aumentar ${label}`} onClick={() => set(value + 1)}>
        <Plus className="size-7" />
      </IconButton>
    </div>
  );
}
