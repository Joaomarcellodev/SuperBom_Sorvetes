import type { ReactNode } from "react";
import { cn } from "@/lib/format";

const iconTones = {
  secondary: "text-secondary",
  primary: "text-primary",
  danger: "text-error",
};

/** Linha de configuração. Com `onClick` vira botão; sem, é só informação. */
export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  tone = "secondary",
  onClick,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  tone?: keyof typeof iconTones;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const body = (
    <>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest [&_svg]:size-[22px]", iconTones[tone])}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-label-lg text-on-surface">{title}</span>
        {subtitle && <span className="block truncate text-body-sm text-on-surface-variant">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-on-surface-variant [&_svg]:size-5">{trailing}</span>}
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-2xl bg-surface-container-low p-3";
  return onClick ? (
    <button type="button" disabled={disabled} onClick={onClick} className={cn(cls, "transition-all active:scale-[0.99] active:bg-surface-container-high disabled:opacity-50")}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
