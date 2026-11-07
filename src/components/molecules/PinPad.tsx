import { Delete, RotateCcw } from "lucide-react";
import { cn } from "@/lib/format";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const keyBase =
  "flex h-16 items-center justify-center rounded-card [@media(max-height:760px)]:h-14 transition-all duration-100 active:scale-95 disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-secondary";

/** Teclado numérico (teclas de 64px): pensado para dedo, luva e mão molhada. */
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
      className={cn(
        keyBase,
        "bg-white/[0.05] text-[26px] font-semibold text-on-surface ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] active:bg-primary-container active:text-on-primary-container",
      )}
    >
      {d}
    </button>
  );
  return (
    <div className="mx-auto grid w-full max-w-[18rem] grid-cols-3 gap-3">
      {DIGITS.map(digitKey)}
      <button type="button" disabled={disabled} onClick={onClear} aria-label="Limpar PIN" className={cn(keyBase, "text-on-surface-variant hover:text-on-surface")}>
        <RotateCcw className="size-6" />
      </button>
      {digitKey("0")}
      <button type="button" disabled={disabled} onClick={onBackspace} aria-label="Apagar último dígito" className={cn(keyBase, "text-on-surface-variant hover:text-on-surface")}>
        <Delete className="size-6" />
      </button>
    </div>
  );
}
