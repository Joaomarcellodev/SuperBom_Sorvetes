"use client";

import Link from "next/link";
import { Avatar } from "../atoms/Avatar";
import { Logo } from "../atoms/Logo";
import { SyncStatusBadge } from "../molecules/SyncStatusBadge";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

export function AppHeader() {
  const { seller } = useSession();
  const { online, syncing } = useSync();

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 bg-surface-container-lowest/85 shadow-[0_4px_20px_rgba(0,8,54,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Logo size="sm" />
          <SyncStatusBadge online={online} syncing={syncing} />
        </div>
        {seller && (
          <Link href="/ajustes" aria-label="Abrir ajustes e trocar de perfil" className="flex shrink-0 items-center gap-2">
            <span className="flex flex-col items-end">
              <span className="text-label-sm leading-none text-on-surface-variant">Vendedor</span>
              <span className="max-w-32 truncate text-label-md font-bold leading-tight text-primary">{seller.name}</span>
            </span>
            <Avatar name={seller.name} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}
