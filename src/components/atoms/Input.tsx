import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  invalid?: boolean;
}

/** 16px de fonte de propósito: abaixo disso o iPhone dá zoom ao focar o campo. */
export function Input({ icon, invalid, className, ...props }: InputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl bg-surface-container-lowest px-3 transition-shadow focus-within:ring-2",
        invalid ? "ring-2 ring-error focus-within:ring-error" : "focus-within:ring-secondary",
      )}
    >
      {icon && <span className="shrink-0 text-on-surface-variant [&_svg]:size-5">{icon}</span>}
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          "min-h-12 w-full bg-transparent text-[16px] text-on-surface outline-none placeholder:text-outline",
          className,
        )}
        {...props}
      />
    </div>
  );
}
