"use client";

import { BadgeCheck, LogOut } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { AvatarPicker } from "../molecules/AvatarPicker";
import { useLogout } from "@/hooks/useLogout";
import { photoToAvatar } from "@/lib/image";
import { updateSellerAvatar } from "@/lib/repo";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Meu perfil: foto, nome, cargo e sair da conta. */
export function ProfileSwitcher() {
  const { seller } = useSession();
  const { syncNow } = useSync();
  const { toast } = useToast();
  const logout = useLogout();
  if (!seller) return null;

  const pick = async (file: File) => {
    try {
      await updateSellerAvatar(seller.id, await photoToAvatar(file));
      toast({ title: "Foto atualizada", description: "Ela também aparece no aparelho do sócio após sincronizar." });
      void syncNow();
    } catch (e) {
      toast({ title: "Não foi possível usar a foto", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
  };

  const remove = async () => {
    await updateSellerAvatar(seller.id, null);
    toast({ title: "Foto removida", tone: "offline" });
    void syncNow();
  };

  return (
    <Card className="space-y-4">
      <AvatarPicker name={seller.name} photo={seller.avatarUrl} onPick={pick} onRemove={remove} />
      <div className="min-w-0 border-t border-white/5 pt-3">
        <p className="flex items-center gap-1.5 font-display text-headline-sm">
          <span className="truncate">{seller.name}</span>
          <BadgeCheck className="size-[18px] shrink-0 text-secondary" aria-label="Perfil verificado por PIN" />
        </p>
        <p className="truncate text-body-sm text-on-surface-variant">{seller.role}</p>
      </div>
      <Button variant="soft" fullWidth icon={<LogOut className="size-5 text-primary" />} onClick={logout}>
        Sair e entrar com outra conta
      </Button>
    </Card>
  );
}
