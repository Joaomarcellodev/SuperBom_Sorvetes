"use client";

import Link from "next/link";
import { Avatar } from "../atoms/Avatar";
import { Logo } from "../atoms/Logo";
import { SyncStatusBadge } from "../molecules/SyncStatusBadge";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

/** Topo fixo: logo + status à esquerda; cargo, nome e foto à direita (abre o perfil em Ajustes). */
export function AppHeader() {
  const { seller } = useSession();
  const { online, syncing } = useSync();

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-surface-container-lowest/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-2 px-3">
        <Link href="/" aria-label="Ir para o painel" className="flex min-w-0 items-center gap-2.5">
          <Logo height={34} />
          <SyncStatusBadge online={online} syncing={syncing} compact />
        </Link>
        {seller && (
          <Link
            href="/ajustes"
            aria-label="Abrir meu perfil e ajustes"
            className="flex shrink-0 items-center gap-2 rounded-control py-1 pl-2 pr-1 transition-colors hover:bg-surface-container-high"
          >
            <span className="hidden flex-col items-end min-[360px]:flex">
              <span className="max-w-40 truncate text-label-sm leading-none text-on-surface-variant">{seller.role}</span>
              <span className="max-w-36 truncate text-label-md font-bold leading-tight text-on-surface">{seller.name}</span>
            </span>
            <Avatar name={seller.name} photo={seller.avatarUrl} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}
