"use client";

import { useState } from "react";
import { CircleCheck, QrCode } from "lucide-react";
import { Button } from "../atoms/Button";
import { Modal } from "../molecules/Modal";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { PixModal } from "./PixModal";
import { formatMoney } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/payment";
import type { PaymentMethod } from "@/lib/types";

/** Quitar uma pendência: escolhe como o cliente pagou (no PIX, mostra o QR Code com o valor). */
export function ReceivePaymentModal({
  open,
  title,
  details,
  amountCents,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  details: string;
  amountCents: number;
  onConfirm: (method: PaymentMethod) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [pixOpen, setPixOpen] = useState(false);

  const close = () => {
    setPixOpen(false);
    onClose();
  };
  const confirm = (m: PaymentMethod) => {
    setPixOpen(false);
    setMethod("dinheiro");
    onConfirm(m);
  };

  return (
    <>
      <Modal
        open={open && !pixOpen}
        onClose={close}
        title="Receber pendência"
        footer={
          <>
            <Button variant="soft" fullWidth onClick={close}>
              Cancelar
            </Button>
            <Button fullWidth icon={<CircleCheck className="size-5" />} onClick={() => confirm(method)}>
              Recebi
            </Button>
          </>
        }
      >
        <div className="rounded-control bg-surface-container-lowest p-3">
          <p className="truncate text-label-lg text-on-surface">{title}</p>
          <p className="text-body-sm text-on-surface-variant">{details}</p>
          <p className="tabular mt-1 font-display text-headline-md text-primary-container">{formatMoney(amountCents)}</p>
        </div>
        <SegmentedControl label="Como o cliente pagou" options={PAYMENT_METHODS} value={method} onChange={setMethod} />
        {method === "pix" && (
          <Button variant="outline" fullWidth icon={<QrCode className="size-5" />} onClick={() => setPixOpen(true)}>
            Mostrar QR Code do PIX
          </Button>
        )}
      </Modal>
      <PixModal
        open={open && pixOpen}
        amountCents={amountCents}
        onClose={() => setPixOpen(false)}
        footer={
          <Button fullWidth icon={<CircleCheck className="size-5" />} onClick={() => confirm("pix")}>
            Recebi o PIX
          </Button>
        }
      />
    </>
  );
}
