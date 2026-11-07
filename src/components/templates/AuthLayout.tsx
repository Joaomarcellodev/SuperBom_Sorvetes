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
      <header className="flex flex-col items-center gap-2 rounded-card bg-surface-container p-6 text-center shadow-card">
        <h1 className="sr-only">Maxbono Sorvetes</h1>
        <Logo size="lg" />
        <p className="max-w-64 text-body-sm text-on-surface-variant">Registro de vendas por rota, com ou sem internet</p>
        <SyncStatusBadge online={online} className="mt-1" />
      </header>
      {children}
    </main>
  );
}
