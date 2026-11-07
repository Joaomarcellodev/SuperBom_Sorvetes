"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftRight, BadgeCheck } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { useSession } from "@/providers/SessionProvider";

export function ProfileSwitcher() {
  const { seller, logout } = useSession();
  const router = useRouter();
  if (!seller) return null;

  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -bottom-6 -right-6 size-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <Avatar name={seller.name} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-display text-headline-sm">
            <span className="truncate">{seller.name}</span>
            <BadgeCheck className="size-[18px] shrink-0 text-secondary" aria-label="Perfil verificado por PIN" />
          </p>
          <p className="truncate text-body-sm text-on-surface-variant">{seller.role}</p>
        </div>
      </div>
      <Button
        className="relative mt-4"
        variant="soft"
        fullWidth
        icon={<ArrowLeftRight className="size-5 text-primary" />}
        onClick={() => {
          logout();
          router.replace("/login");
        }}
      >
        Trocar de perfil
      </Button>
    </Card>
  );
}
