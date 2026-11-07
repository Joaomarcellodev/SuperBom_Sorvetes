"use client";

import { LogOut } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { ConfirmDialog } from "../molecules/ConfirmDialog";
import { useLogout } from "@/hooks/useLogout";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

/** Confirmação de "sair da conta". Avisa que vendas pendentes continuam no aparelho. */
export function SignOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { seller } = useSession();
  const { pending } = useSync();
  const logout = useLogout();
  const waiting = pending.sales + pending.other;

  return (
    <ConfirmDialog
      open={open}
      title="Sair da conta?"
      icon={<LogOut />}
      details={
        <span className="flex items-center justify-center gap-2">
          <Avatar name={seller?.name ?? ""} photo={seller?.avatarUrl} size="sm" className="size-6 text-[10px]" />
          {seller?.name}
        </span>
      }
      description={
        waiting > 0
          ? `Você volta para a escolha de conta. ${pending.sales === 1 ? "A venda pendente fica" : `As ${pending.sales} vendas pendentes ficam`} no aparelho e ${pending.sales === 1 ? "sobe" : "sobem"} normalmente.`
          : "Você volta para a escolha de conta e pode entrar com outro perfil."
      }
      confirmLabel="Sair"
      onConfirm={() => {
        onClose();
        logout();
      }}
      onCancel={onClose}
    />
  );
}
