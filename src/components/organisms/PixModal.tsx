"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "../atoms/Button";
import { Banner } from "../molecules/Banner";
import { Modal } from "../molecules/Modal";
import { PixQrCode } from "../molecules/PixQrCode";
import { formatMoney } from "@/lib/money";
import { buildPixPayload, getPixConfig } from "@/lib/pix";

/** Mostra o QR Code e o "copia e cola" do PIX com o valor da venda já preenchido. */
export function PixModal({
  open,
  amountCents,
  onClose,
  footer,
}: {
  open: boolean;
  amountCents: number;
  onClose: () => void;
  /** ações extras (ex.: "Recebi o PIX") */
  footer?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const config = getPixConfig();
  const payload = config ? buildPixPayload({ ...config, amountCents }) : null;

  const copy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem permissão de área de transferência: o cliente ainda pode ler o QR Code */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Receber com PIX" footer={footer}>
      {!config || !payload ? (
        <Banner tone="error" icon={<TriangleAlert />} title="Chave PIX não configurada">
          Preencha NEXT_PUBLIC_PIX_KEY no .env.local (e no deploy) e gere o app de novo.
        </Banner>
      ) : (
        <>
          <div className="text-center">
            <span className="text-label-md uppercase text-on-surface-variant">Valor</span>
            <p className="tabular font-display text-metric-lg leading-none text-primary-container">{formatMoney(amountCents)}</p>
          </div>
          <PixQrCode payload={payload} />
          <p className="text-center text-body-sm text-on-surface-variant">
            O cliente aponta a câmera do app do banco. Chave: <span className="font-semibold text-on-surface">{config.key}</span>
          </p>
          <Button variant="soft" fullWidth icon={copied ? <Check className="size-5" /> : <Copy className="size-5" />} onClick={() => void copy()}>
            {copied ? "Código copiado" : "Copiar PIX copia e cola"}
          </Button>
          {amountCents <= 0 && (
            <p className="text-center text-body-sm text-on-surface-variant">Sem valor definido: o cliente digita o valor no banco.</p>
          )}
        </>
      )}
    </Modal>
  );
}
