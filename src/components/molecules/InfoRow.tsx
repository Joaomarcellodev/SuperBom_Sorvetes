import type { ReactNode } from "react";

export function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-3">
      <span className="flex min-w-0 items-center gap-2 text-on-surface-variant [&_svg]:size-5 [&_svg]:shrink-0">
        {icon}
        <span className="truncate text-body-sm">{label}</span>
      </span>
      <span className="shrink-0 text-label-md text-on-surface">{value}</span>
    </div>
  );
}
