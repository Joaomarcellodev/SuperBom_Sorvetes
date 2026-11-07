"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { IconButton } from "../atoms/IconButton";
import { Logo } from "../atoms/Logo";
import { ConfirmDialog } from "../molecules/ConfirmDialog";
import { SyncStatusBadge } from "../molecules/SyncStatusBadge";
import { useLogout } from "@/hooks/useLogout";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

export function AppHeader() {
  const { seller } = useSession();
  const { online, syncing, pending } = useSync();
  const logout = useLogout();
  const [confirmOut, setConfirmOut] = useState(false);
  const waiting = pending.sales + pending.other;

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-surface-container-lowest/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-2 px-3">
        <Link href="/" aria-label="Ir para o painel" className="flex min-w-0 items-center gap-2.5">
          <Logo size="sm" />
          <SyncStatusBadge online={online} syncing={syncing} />
        </Link>
        {seller && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/ajustes"
              aria-label="Abrir meu perfil e ajustes"
              className="flex items-center gap-2 rounded-control py-1 pl-2 pr-1 transition-colors hover:bg-surface-container-high"
            >
              <span className="flex flex-col items-end">
                <span className="text-label-sm leading-none text-on-surface-variant">Vendedor</span>
                <span className="max-w-28 truncate text-label-md font-bold leading-tight text-on-surface">{seller.name}</span>
              </span>
              <Avatar name={seller.name} photo={seller.avatarUrl} size="sm" />
            </Link>
            <IconButton label="Sair da conta" className="size-10" onClick={() => setConfirmOut(true)}>
              <LogOut className="size-5" />
            </IconButton>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmOut}
        title="Sair da conta?"
        description={
          waiting > 0
            ? `Você vai voltar para a escolha de conta. ${pending.sales} ${pending.sales === 1 ? "venda pendente continua" : "vendas pendentes continuam"} guardada${pending.sales === 1 ? "" : "s"} neste aparelho e ${pending.sales === 1 ? "será enviada" : "serão enviadas"} normalmente.`
            : "Você vai voltar para a escolha de conta e poderá entrar com outro perfil."
        }
        confirmLabel="Sair"
        onConfirm={() => {
          setConfirmOut(false);
          logout();
        }}
        onCancel={() => setConfirmOut(false)}
      />
    </header>
  );
}
