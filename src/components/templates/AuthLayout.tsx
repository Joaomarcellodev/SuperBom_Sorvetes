"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../atoms/Logo";
import { SyncStatusBadge } from "../molecules/SyncStatusBadge";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

/** Casca da tela de login: sem navegação, com a marca em destaque. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { ready, seller } = useSession();
  const { online } = useSync();
  const router = useRouter();

  useEffect(() => {
    if (ready && seller) router.replace("/");
  }, [ready, seller, router]);

  return (
    <main className="pb-safe pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-3 py-6">
      <header className="brand-hero relative flex flex-col items-center gap-3 overflow-hidden rounded-card px-6 pb-5 pt-6 text-center ring-1 ring-inset ring-white/[0.06]">
        <h1 className="sr-only">Maxbono Sorvetes</h1>
        <Logo variant="full" height={150} className="relative drop-shadow-[0_8px_24px_rgba(0,8,54,0.6)]" />
        <p className="relative max-w-64 text-body-sm text-on-surface-variant">Registro de vendas por rota, com ou sem internet</p>
        <SyncStatusBadge online={online} className="relative" />
      </header>
      {children}
    </main>
  );
}
