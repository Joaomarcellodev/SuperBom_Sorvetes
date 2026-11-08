"use client";

import { useState } from "react";
import { CircleCheck, QrCode } from "lucide-react";
import { Button } from "../atoms/Button";
import { Modal } from "../molecules/Modal";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { PixModal } from "./PixModal";
import { saleAmount } from "@/lib/finance";
import { formatDayLabel } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { PAYMENT_METHODS, paymentMethodLabel } from "@/lib/payment";
import { describeItems } from "@/lib/products";
import { settleSale } from "@/lib/repo";
import type { PaymentMethod, ProductId, Sale } from "@/lib/types";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Quitar uma pendência: escolhe como o cliente pagou (no PIX, mostra o QR Code com o valor). */
export function ReceivePaymentModal({
  sale,
  defaults,
  onClose,
}: {
  /** pendência a receber; null = fechado */
  sale: Sale | null;
  defaults: Record<ProductId, number>;
  onClose: () => void;
}) {
  const { syncNow } = useSync();
  const { toast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [pixOpen, setPixOpen] = useState(false);

  const amountCents = sale ? saleAmount(sale, defaults) : 0;
  const name = sale?.pointName || "Cliente sem nome";

  const close = () => {
    setPixOpen(false);
    setMethod("dinheiro");
    onClose();
  };

  const confirm = async (paidWith: PaymentMethod) => {
    if (!sale) return;
    close();
    await settleSale(sale.id, paidWith);
    toast({ title: "Pendência recebida", description: `${name} pagou ${formatMoney(amountCents)} (${paymentMethodLabel(paidWith)}).` });
    void syncNow();
  };

  return (
    <>
      <Modal
        open={sale !== null && !pixOpen}
        onClose={close}
        title="Receber pendência"
        footer={
          <>
            <Button variant="soft" fullWidth onClick={close}>
              Cancelar
            </Button>
            <Button fullWidth icon={<CircleCheck className="size-5" />} onClick={() => void confirm(method)}>
              Recebi
            </Button>
          </>
        }
      >
        {sale && (
          <div className="rounded-control bg-surface-container-lowest p-3">
            <p className="truncate text-label-lg text-on-surface">{name}</p>
            <p className="text-body-sm text-on-surface-variant">
              {formatDayLabel(sale.saleDate)} · {describeItems(sale.items)}
            </p>
            <p className="tabular mt-1 font-display text-headline-md text-primary-container">{formatMoney(amountCents)}</p>
          </div>
        )}
        <SegmentedControl label="Como o cliente pagou" options={PAYMENT_METHODS} value={method} onChange={setMethod} />
        {method === "pix" && (
          <Button variant="outline" fullWidth icon={<QrCode className="size-5" />} onClick={() => setPixOpen(true)}>
            Mostrar QR Code do PIX
          </Button>
        )}
      </Modal>
      <PixModal
        open={sale !== null && pixOpen}
        amountCents={amountCents}
        onClose={() => setPixOpen(false)}
        footer={
          <Button fullWidth icon={<CircleCheck className="size-5" />} onClick={() => void confirm("pix")}>
            Recebi o PIX
          </Button>
        }
      />
    </>
  );
}
