"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  // Quem usa o modal costuma passar uma função nova a cada render. Guardar em ref evita
  // que o efeito abaixo rode de novo a cada tecla e roube o foco do campo sendo digitado.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Foca o painel só se nenhum campo dele (ex.: autoFocus) já pegou o foco.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  // Portal no <body>: o modal não fica preso dentro de outro <form> nem de um card com overflow.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div aria-hidden className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="pb-safe relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-card bg-surface-container-high p-5 shadow-card outline-none ring-1 ring-secondary/25 sm:rounded-card"
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
    </div>,
    document.body,
  );
}
