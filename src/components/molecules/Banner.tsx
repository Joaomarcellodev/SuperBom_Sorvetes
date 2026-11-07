import type { ReactNode } from "react";
import { cn } from "@/lib/format";

const tones = {
  info: { box: "bg-surface-container-high", icon: "bg-secondary/15 text-secondary", title: "text-secondary" },
  offline: { box: "bg-surface-container-low", icon: "bg-primary-container/20 text-primary-container", title: "text-primary" },
  error: { box: "bg-error-container/30", icon: "bg-error/15 text-error", title: "text-error" },
};

export function Banner({
  tone = "info",
  icon,
  title,
  children,
}: {
  tone?: keyof typeof tones;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  const t = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex items-center gap-3 rounded-2xl p-3", t.box)}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-[22px]", t.icon)}>{icon}</span>
      <div className="min-w-0">
        <p className={cn("text-label-md font-bold", t.title)}>{title}</p>
        {children && <p className="mt-0.5 text-body-sm leading-snug text-on-surface-variant">{children}</p>}
      </div>
    </div>
  );
}
