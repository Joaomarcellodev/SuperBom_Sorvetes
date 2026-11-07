import type { ReactNode } from "react";

export function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <h2 className="font-display text-headline-sm text-on-surface">{title}</h2>
      {aside && <div className="text-label-md text-secondary">{aside}</div>}
    </div>
  );
}
