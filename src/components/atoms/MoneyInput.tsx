import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/format";
import { formatMoneyInput, parseMoneyDigits } from "@/lib/money";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "size"> {
  /** valor em centavos */
  value: number;
  onChange: (cents: number) => void;
  invalid?: boolean;
  size?: "md" | "sm";
}

/**
 * Campo de dinheiro com máscara de centavos: digitar 1 2 5 0 mostra "12,50".
 * Abre o teclado numérico no celular e nunca aceita vírgula no lugar errado.
 */
export function MoneyInput({ value, onChange, invalid, size = "md", className, ...props }: MoneyInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-control bg-surface-container-lowest px-3 transition-shadow focus-within:ring-2",
        invalid ? "ring-2 ring-error focus-within:ring-error" : "focus-within:ring-secondary",
      )}
    >
      <span className="shrink-0 text-label-lg text-on-surface-variant">R$</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        value={formatMoneyInput(value)}
        onChange={(e) => onChange(parseMoneyDigits(e.target.value))}
        onFocus={(e) => e.target.select()}
        className={cn(
          "tabular w-full bg-transparent text-right text-[16px] text-on-surface outline-none",
          size === "md" ? "min-h-12 font-display text-headline-sm" : "min-h-10",
          className,
        )}
        {...props}
      />
    </div>
  );
}
