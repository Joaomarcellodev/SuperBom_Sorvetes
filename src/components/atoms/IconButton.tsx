import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: botão só com ícone precisa de nome para leitor de tela. */
  label: string;
  children: ReactNode;
  tone?: "neutral" | "primary" | "danger";
  size?: "md" | "lg";
}

const tones = {
  neutral: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
  primary: "bg-primary-container text-on-primary-container shadow-glow-primary",
  danger: "bg-surface-container-high text-error hover:bg-error-container/40",
};

/** Alvos de toque grandes (48px / 56px): pensado para luva e mão molhada. */
export function IconButton({ label, children, tone = "neutral", size = "md", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-control transition-all active:scale-90 disabled:opacity-40",
        size === "md" ? "size-12" : "size-14",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
