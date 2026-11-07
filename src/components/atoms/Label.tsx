import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

export function Label({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label className={cn("block text-label-sm uppercase text-on-surface-variant", className)} {...props}>
      {children}
    </label>
  );
}
