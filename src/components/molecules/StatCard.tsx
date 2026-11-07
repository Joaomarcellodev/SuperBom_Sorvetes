import type { ReactNode } from "react";
import { Card } from "../atoms/Card";
import { cn, formatInt } from "@/lib/format";

export function StatCard({
  icon,
  label,
  value,
  caption,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  caption: string;
  accent?: boolean;
}) {
  return (
    <Card tone="raised" className="flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-on-surface-variant [&_svg]:size-[18px]">
        {icon}
        <span className="text-label-sm uppercase">{label}</span>
      </div>
      <div className="mt-3">
        <span className={cn("tabular block font-display text-metric", accent ? "text-primary-dim" : "text-on-surface")}>
          {formatInt(value)}
        </span>
        <span className="text-body-sm text-on-surface-variant">{caption}</span>
      </div>
    </Card>
  );
}
