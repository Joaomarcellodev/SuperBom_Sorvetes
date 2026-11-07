import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/format";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "soft" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  /** React 19: ref chega como prop comum (ex.: focar "Cancelar" ao abrir uma confirmação) */
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary-container text-on-primary-container shadow-glow-primary-lg hover:brightness-105",
  secondary: "bg-secondary text-on-secondary shadow-glow-secondary hover:brightness-105",
  soft: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
  outline: "border-2 border-secondary bg-transparent text-on-surface hover:bg-secondary/10",
  ghost: "bg-transparent text-secondary hover:bg-surface-container-high",
  danger: "bg-danger text-on-danger shadow-[0_4px_14px_rgba(217,61,66,0.3)] hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-label-lg",
  md: "h-12 px-5 text-label-lg",
  lg: "h-14 px-6 font-display text-headline-sm",
};

export function buttonStyles(variant: Variant = "primary", size: Size = "md", fullWidth?: boolean, className?: string): string {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-control transition-all active:scale-[0.97]",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  fullWidth,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonStyles(variant, size, fullWidth, className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
