"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";

/** Sai do perfil atual e volta para a tela de escolha de conta. Vendas pendentes continuam no aparelho. */
export function useLogout(): () => void {
  const { logout } = useSession();
  const router = useRouter();
  return useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);
}
