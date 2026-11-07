import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-low px-6 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface-container-high text-secondary [&_svg]:size-8">{icon}</span>
      <p className="font-display text-headline-sm">{title}</p>
      {description && <p className="max-w-xs text-body-md text-on-surface-variant">{description}</p>}
      {action}
    </div>
  );
}
