"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Trash2 } from "lucide-react";
import { Button } from "../atoms/Button";
import { cn } from "@/lib/format";

/**
 * Pergunta de confirmação (excluir, sair, limpar). Janela compacta e centralizada:
 * ícone, título curto, o item afetado em destaque e uma frase de explicação.
 * O foco começa em "Cancelar": Enter por engano não apaga nada.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  details,
  icon,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** o que vai ser afetado (ex.: "r1 · 3 vendas"), mostrado em destaque */
  details?: ReactNode;
  /** ícone do topo; padrão: lixeira (danger) ou interrogação */
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancelRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-[#000521]/75 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-[22rem] animate-dialog-in rounded-card bg-surface-container-high p-6 text-center shadow-[0_24px_60px_rgba(0,5,33,0.6)] ring-1 ring-inset ring-white/[0.07]"
      >
        <span
          aria-hidden
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-full ring-8 [&_svg]:size-6",
            danger ? "bg-danger/15 text-[#ff6b6f] ring-danger/[0.07]" : "bg-primary-container/15 text-primary-container ring-primary-container/[0.06]",
          )}
        >
          {icon ?? (danger ? <Trash2 /> : <HelpCircle />)}
        </span>

        <h2 id={titleId} className="mt-4 font-display text-headline-sm text-on-surface">
          {title}
        </h2>

        {details && (
          <div className="mt-3 rounded-control bg-surface-container-lowest px-3 py-2.5 text-label-lg text-on-surface ring-1 ring-inset ring-white/[0.05]">
            {details}
          </div>
        )}

        {description && (
          <p id={descId} className="mt-3 text-body-md text-on-surface-variant">
            {description}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Button ref={cancelRef} variant="soft" fullWidth onClick={onCancel} className="bg-white/[0.07]! ring-1 ring-inset ring-white/15 hover:bg-white/[0.12]!">
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
