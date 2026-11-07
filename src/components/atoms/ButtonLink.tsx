import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "./Button";

/** Link com cara de botão (evita <button> dentro de <a>, que é HTML inválido). */
export function ButtonLink({
  href,
  variant,
  size,
  icon,
  fullWidth,
  className,
  children,
}: {
  href: string;
  variant?: Parameters<typeof buttonStyles>[0];
  size?: Parameters<typeof buttonStyles>[1];
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonStyles(variant, size, fullWidth, className)}>
      {icon}
      {children}
    </Link>
  );
}
