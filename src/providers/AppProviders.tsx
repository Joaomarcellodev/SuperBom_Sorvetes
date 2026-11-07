"use client";

import type { ReactNode } from "react";
import { PwaProvider } from "./PwaProvider";
import { SessionProvider } from "./SessionProvider";
import { SyncProvider } from "./SyncProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <PwaProvider>
        <SyncProvider>
          <SessionProvider>{children}</SessionProvider>
        </SyncProvider>
      </PwaProvider>
    </ToastProvider>
  );
}
