import type { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Tone = "base" | "raised" | "low" | "inset";

const tones: Record<Tone, string> = {
  base: "bg-surface-container shadow-card",
  raised: "bg-surface-container-high shadow-card",
  low: "bg-surface-container-low",
  inset: "bg-surface-container-lowest",
};

export function Card({
  tone = "base",
  padded = true,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; padded?: boolean }) {
  return <div className={cn("rounded-3xl", tones[tone], padded && "p-4", className)} {...props} />;
}
