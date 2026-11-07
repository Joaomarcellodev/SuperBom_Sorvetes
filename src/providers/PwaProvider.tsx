"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Evento não padronizado, só existe em navegadores baseados em Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type SwStatus = "disabled" | "unsupported" | "registering" | "ready" | "error";

interface PwaState {
  swStatus: SwStatus;
  canInstall: boolean;
  installed: boolean;
  isIOS: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const PwaContext = createContext<PwaState | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [swStatus, setSwStatus] = useState<SwStatus>("registering");
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanInstall(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Em desenvolvimento o service worker atrapalha (cache de código velho): só em produção.
    if (process.env.NODE_ENV !== "production") {
      setSwStatus("disabled");
    } else if (!("serviceWorker" in navigator)) {
      setSwStatus("unsupported");
    } else {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => setSwStatus("ready"))
        .catch(() => setSwStatus("error"));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback<PwaState["install"]>(async () => {
    const evt = deferred.current;
    if (!evt) return "unavailable";
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    deferred.current = null;
    setCanInstall(false);
    return outcome;
  }, []);

  const value = useMemo(
    () => ({ swStatus, canInstall, installed, isIOS, install }),
    [swStatus, canInstall, installed, isIOS, install],
  );
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa(): PwaState {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa fora do PwaProvider");
  return ctx;
}
