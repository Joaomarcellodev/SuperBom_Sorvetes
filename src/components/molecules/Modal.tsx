"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "../atoms/IconButton";

/** Folha que sobe de baixo (padrão de celular). Esc e toque no fundo fecham. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div aria-hidden className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="pb-safe relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl bg-surface-container-high p-5 shadow-card outline-none ring-1 ring-secondary/25 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id={titleId} className="font-display text-headline-md">{title}</h2>
          <IconButton label="Fechar" onClick={onClose} className="size-10">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="space-y-4 overflow-y-auto">{children}</div>
        {footer && <div className="mt-5 flex gap-3">{footer}</div>}
      </div>
    </div>
  );
}
