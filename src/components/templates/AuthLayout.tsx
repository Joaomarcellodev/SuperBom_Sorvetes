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
    <main className="login-bg relative min-h-dvh overflow-x-hidden">
      <div className="pb-safe pt-safe relative mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-7 px-6 py-10 [@media(max-height:760px)]:gap-5 [@media(max-height:760px)]:py-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="sr-only">Maxbono Sorvetes</h1>
          <Logo variant="full" height={132} className="drop-shadow-[0_10px_30px_rgba(0,8,54,0.7)] [@media(max-height:760px)]:h-24" />
          <p className="text-body-sm text-on-surface-variant">Vendas por rota, com ou sem internet</p>
          <SyncStatusBadge online={online} />
        </header>
        {children}
      </div>
    </main>
  );
}
