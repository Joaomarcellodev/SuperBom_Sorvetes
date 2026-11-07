"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, ReceiptText, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/historico", label: "Histórico", icon: ReceiptText },
  { href: "/registrar", label: "Registrar", icon: Plus, highlight: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-surface-container-lowest/95 backdrop-blur-xl"
    >
      <ul className="mx-auto grid h-16 w-full max-w-xl grid-cols-5 items-center px-1">
        {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const highlight = "highlight" in rest;
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 transition-colors",
                  active ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {highlight ? (
                  <span className="flex h-9 w-12 items-center justify-center rounded-control bg-primary-container text-on-primary-container shadow-glow-primary">
                    <Icon className="size-6" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon className="size-[22px]" />
                )}
                <span className={cn("text-[11px] leading-none", active ? "font-bold" : "font-medium")}>{label}</span>
                {active && !highlight && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-b bg-primary-container" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
