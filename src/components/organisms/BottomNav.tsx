"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, Settings, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/registrar", label: "Registrar", icon: ShoppingCart, highlight: true },
  { href: "/historico", label: "Histórico", icon: ReceiptText },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest/90 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex h-16 w-full max-w-xl items-center justify-around px-1">
        {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const highlight = "highlight" in rest;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-16 flex-col items-center justify-center px-2 transition-colors",
                  active ? "font-bold text-primary-container" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {highlight ? (
                  <span className="-mt-4 flex size-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-glow-primary-lg">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <Icon className="size-6" />
                )}
                <span className={cn("mt-0.5 text-label-sm", highlight && "text-primary-container")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
