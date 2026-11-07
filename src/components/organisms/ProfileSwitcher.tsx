"use client";

import { useState } from "react";
import { BadgeCheck, Check, KeyRound, LogOut, Pencil, X } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { IconButton } from "../atoms/IconButton";
import { Input } from "../atoms/Input";
import { AvatarPicker } from "../molecules/AvatarPicker";
import { ChangePinModal } from "./ChangePinModal";
import { SignOutDialog } from "./SignOutDialog";
import { photoToAvatar } from "@/lib/image";
import { ROLE_MAX, updateSellerAvatar, updateSellerRole } from "@/lib/repo";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Meu perfil: foto, nome, cargo e sair da conta. */
export function ProfileSwitcher() {
  const { seller } = useSession();
  const { syncNow, online } = useSync();
  const { toast } = useToast();
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  if (!seller) return null;

  const startRoleEdit = () => {
    setRoleDraft(seller.role);
    setRoleError(null);
    setEditingRole(true);
  };

  const saveRole = async () => {
    try {
      await updateSellerRole(seller.id, roleDraft);
      setEditingRole(false);
      toast({ title: "Cargo atualizado", description: "Aparece no topo do app e no login dos dois aparelhos." });
      void syncNow();
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : "Não foi possível salvar o cargo.");
    }
  };

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
        {editingRole ? (
          <form
            className="mt-2 space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRole();
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <Input
                  autoFocus
                  aria-label="Cargo"
                  maxLength={ROLE_MAX}
                  placeholder="Ex.: Sócio administrador"
                  value={roleDraft}
                  invalid={Boolean(roleError)}
                  onChange={(e) => setRoleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditingRole(false)}
                />
              </div>
              <IconButton label="Salvar cargo" tone="primary" type="submit" disabled={!roleDraft.trim() || roleDraft.trim() === seller.role}>
                <Check className="size-5" />
              </IconButton>
              <IconButton label="Cancelar" onClick={() => setEditingRole(false)}>
                <X className="size-5" />
              </IconButton>
            </div>
            {roleError ? (
              <p role="alert" className="text-body-sm text-error">{roleError}</p>
            ) : (
              <p className="text-body-sm text-on-surface-variant">Só o cargo pode ser mudado aqui. Nome e PIN ficam com o administrador.</p>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={startRoleEdit}
            className="group -ml-1 mt-0.5 inline-flex max-w-full items-center gap-1.5 rounded-chip px-1 py-0.5 text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="truncate">{seller.role}</span>
            <Pencil className="size-3.5 shrink-0 text-secondary" aria-hidden />
            <span className="sr-only">Editar cargo</span>
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="soft" fullWidth icon={<KeyRound className="size-5 text-secondary" />} onClick={() => setPinOpen(true)}>
          Mudar PIN
        </Button>
        <Button variant="soft" fullWidth icon={<LogOut className="size-5 text-primary" />} onClick={() => setSignOutOpen(true)}>
          Sair e entrar com outra conta
        </Button>
      </div>
      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <ChangePinModal
        open={pinOpen}
        sellerId={seller.id}
        online={online}
        onClose={() => setPinOpen(false)}
        onChanged={() => {
          setPinOpen(false);
          toast({ title: "PIN alterado", description: "Use o novo PIN a partir de agora, nos dois aparelhos." });
          void syncNow();
        }}
      />
    </Card>
  );
}
