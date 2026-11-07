import { Delete, RotateCcw } from "lucide-react";
import { cn } from "@/lib/format";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const keyBase = "flex h-14 items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-40";

/** Teclado numérico de 56px por tecla. */
export function PinPad({
  onDigit,
  onBackspace,
  onClear,
  disabled,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const digitKey = (d: string) => (
    <button
      key={d}
      type="button"
      disabled={disabled}
      onClick={() => onDigit(d)}
      className={cn(keyBase, "bg-surface-container-high font-display text-headline-lg text-on-surface active:bg-primary-container active:text-on-primary-container")}
    >
      {d}
    </button>
  );
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIGITS.map(digitKey)}
      <button type="button" disabled={disabled} onClick={onClear} aria-label="Limpar PIN" className={cn(keyBase, "bg-surface-container-low text-on-surface-variant")}>
        <RotateCcw className="size-6" />
      </button>
      {digitKey("0")}
      <button type="button" disabled={disabled} onClick={onBackspace} aria-label="Apagar último dígito" className={cn(keyBase, "bg-surface-container-low text-on-surface-variant")}>
        <Delete className="size-6" />
      </button>
    </div>
  );
}
