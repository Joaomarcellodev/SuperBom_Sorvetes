import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode;
}

export function Select({ icon, className, children, ...props }: SelectProps) {
  return (
    <div className="relative flex items-center gap-2 rounded-control bg-surface-container-lowest px-3 focus-within:ring-2 focus-within:ring-secondary">
      {icon && <span className="shrink-0 text-secondary [&_svg]:size-5">{icon}</span>}
      <select
        className={cn("min-h-12 w-full appearance-none bg-transparent pr-6 font-display text-headline-sm text-on-surface outline-none", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 size-5 text-on-surface-variant" />
    </div>
  );
}
