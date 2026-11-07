import { cn } from "@/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-surface-container-high", className)} />;
}
