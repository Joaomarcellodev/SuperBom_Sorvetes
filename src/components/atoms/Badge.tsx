import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export type BadgeTone = "primary" | "secondary" | "tertiary" | "neutral" | "danger";

const tones: Record<BadgeTone, string> = {
  primary: "bg-primary-container/15 text-primary",
  secondary: "bg-secondary-container/20 text-secondary",
  tertiary: "bg-tertiary-container/20 text-tertiary",
  neutral: "bg-surface-container-highest text-on-surface-variant",
  danger: "bg-error-container/40 text-error",
};

export function Badge({
  tone = "neutral",
  uppercase,
  className,
  children,
}: {
  tone?: BadgeTone;
  uppercase?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-chip px-2.5 py-0.5 text-label-sm",
        uppercase && "uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
