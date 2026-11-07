import type { ReactNode } from "react";

export function PageHeading({ title, description, aside }: { title: string; description?: string; aside?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="font-display text-headline-xl text-on-surface">{title}</h1>
        {description && <p className="mt-0.5 text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
