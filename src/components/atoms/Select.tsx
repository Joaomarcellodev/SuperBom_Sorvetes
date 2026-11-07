import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode;
  /** "field" = caixa grande de formulário; "chip" = compacto, para filtros */
  variant?: "field" | "chip";
}

export function Select({ icon, variant = "field", className, children, ...props }: SelectProps) {
  const chip = variant === "chip";
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 bg-surface-container-lowest focus-within:ring-2 focus-within:ring-secondary",
        chip ? "rounded-full bg-surface-container-high pl-3 pr-8" : "rounded-2xl px-3",
      )}
    >
      {icon && <span className="shrink-0 text-secondary [&_svg]:size-5">{icon}</span>}
      <select
        className={cn(
          "w-full appearance-none bg-transparent pr-6 text-on-surface outline-none",
          chip ? "h-10 text-label-lg" : "min-h-12 font-display text-headline-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 size-5 text-on-surface-variant" />
    </div>
  );
}
