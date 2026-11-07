import type { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Tone = "base" | "raised" | "low" | "inset";

const tones: Record<Tone, string> = {
  base: "bg-surface-container shadow-card ring-1 ring-inset ring-white/[0.04]",
  raised: "bg-surface-container-high shadow-card ring-1 ring-inset ring-white/[0.05]",
  low: "bg-surface-container-low",
  inset: "bg-surface-container-lowest",
};

export function Card({
  tone = "base",
  padded = true,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; padded?: boolean }) {
  return <div className={cn("rounded-card", tones[tone], padded && "p-4", className)} {...props} />;
}
