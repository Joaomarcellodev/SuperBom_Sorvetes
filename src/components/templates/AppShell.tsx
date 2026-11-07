"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../organisms/AppHeader";
import { BottomNav } from "../organisms/BottomNav";
import { SplashScreen } from "./SplashScreen";
import { useSession } from "@/providers/SessionProvider";

/** Casca das telas internas: protege o acesso (precisa de perfil) e põe cabeçalho + navegação. */
export function AppShell({ children }: { children: ReactNode }) {
  const { ready, seller } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !seller) router.replace("/login");
  }, [ready, seller, router]);

  if (!ready || !seller) return <SplashScreen />;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl space-y-4 px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(5rem+env(safe-area-inset-top,0px))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
