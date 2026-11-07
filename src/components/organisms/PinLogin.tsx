"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, KeyRound, WifiOff, Zap } from "lucide-react";
import { Banner } from "../molecules/Banner";
import { PinDots } from "../molecules/PinDots";
import { PinPad } from "../molecules/PinPad";
import { ProfileCard } from "../molecules/ProfileCard";
import { Toggle } from "../atoms/Toggle";
import { Skeleton } from "../atoms/Skeleton";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";

const PIN_LENGTH = 4;
const LAST_SELLER_KEY = "superbom.lastSeller";

type Status = "idle" | "checking" | "error" | "success";

export function PinLogin() {
  const { ready, sellers, login } = useSession();
  const { configured, online, syncing, lastSyncAt } = useSync();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [keep, setKeep] = useState(true);
  const busy = useRef(false);

  // Seleciona o último perfil usado neste aparelho (ou o primeiro da lista).
  const lastUsed = typeof window === "undefined" ? null : safeGet(LAST_SELLER_KEY);
  const selected = sellers.find((s) => s.id === selectedId) ?? sellers.find((s) => s.id === lastUsed) ?? sellers[0];

  const attempt = async (value: string) => {
    if (!selected || busy.current) return;
    busy.current = true;
    setStatus("checking");
    const ok = await login(selected.id, value, keep);
    if (ok) {
      setStatus("success");
      try {
        localStorage.setItem(LAST_SELLER_KEY, selected.id);
      } catch {
        /* ignore */
      }
      setTimeout(() => router.replace("/"), 350);
    } else {
      setStatus("error");
      setTimeout(() => {
        setPin("");
        setStatus("idle");
        busy.current = false;
      }, 650);
    }
  };

  const addDigit = (d: string) => {
    if (busy.current || pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) void attempt(next);
  };

  useEffect(() => {
    // Teclado físico (testes no computador).
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) addDigit(e.key);
      else if (e.key === "Backspace" && !busy.current) setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ready) return <Skeleton className="h-96" />;

  if (sellers.length === 0) {
    return !configured ? (
      <Banner tone="error" icon={<KeyRound />} title="Supabase não configurado">
        Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local e rode o SQL de supabase/migrations.
      </Banner>
    ) : !online ? (
      <Banner tone="offline" icon={<WifiOff />} title="Conecte-se uma vez">
        Na primeira vez, o app precisa de internet para baixar os perfis. Depois disso funciona offline.
      </Banner>
    ) : syncing || !lastSyncAt ? (
      <Skeleton className="h-96" />
    ) : (
      <Banner tone="error" icon={<KeyRound />} title="Nenhum perfil cadastrado">
        Rode o SQL de supabase/migrations/0001_init.sql no Supabase para criar os dois sócios.
      </Banner>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <section aria-label="Quem está usando?" className="w-full">
        <div role="radiogroup" aria-label="Perfil" className="flex flex-wrap justify-center gap-4">
          {sellers.map((s) => (
            <ProfileCard
              key={s.id}
              seller={s}
              selected={s.id === selected?.id}
              onSelect={() => {
                if (busy.current) return;
                setSelectedId(s.id);
                setPin("");
                setStatus("idle");
              }}
            />
          ))}
        </div>
      </section>

      <section aria-label="PIN" className="flex w-full flex-col items-center gap-3">
        <p className="flex items-center gap-2 text-body-md text-on-surface-variant">
          <KeyRound className="size-4 text-secondary" />
          Digite o PIN de <span className="font-bold text-on-surface">{selected?.name.split(" ")[0]}</span>
        </p>
        <PinDots length={pin.length} total={PIN_LENGTH} state={status === "error" ? "error" : status === "success" ? "success" : "idle"} />
        <p role="alert" className="min-h-5 text-center text-body-sm text-error">
          {status === "error" ? "PIN incorreto. Tente de novo." : ""}
        </p>
        <PinPad
          disabled={status === "checking" || status === "success"}
          onDigit={addDigit}
          onBackspace={() => !busy.current && setPin((p) => p.slice(0, -1))}
          onClear={() => !busy.current && setPin("")}
        />
      </section>

      <label className="flex cursor-pointer items-center justify-center gap-2 text-body-sm text-on-surface">
        <Toggle checked={keep} onChange={setKeep} label="Manter conectado" />
        Manter conectado
      </label>

      <p className="flex max-w-[18rem] items-center justify-center gap-1.5 text-center text-label-sm text-on-surface-variant">
        {online ? <Zap className="size-3.5 shrink-0 text-secondary" /> : <CloudOff className="size-3.5 shrink-0 text-primary" />}
        {online ? "Funciona sem internet: as vendas sobem ao reconectar." : "Sem internet: o PIN é conferido no próprio aparelho."}
      </p>
    </div>
  );
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

