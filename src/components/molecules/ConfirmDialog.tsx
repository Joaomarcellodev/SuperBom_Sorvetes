"use client";

import { Button } from "../atoms/Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="soft" fullWidth onClick={onCancel}>Cancelar</Button>
          <Button variant={danger ? "danger" : "primary"} fullWidth onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-body-md text-on-surface-variant">{description}</p>
    </Modal>
  );
}
