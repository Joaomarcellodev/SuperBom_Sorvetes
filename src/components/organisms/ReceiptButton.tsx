"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "../atoms/Button";
import { buildReceiptPdf, receiptNumber, shareOrDownloadPdf, type ReceiptInfo } from "@/lib/receipt";
import type { Sale } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";

/** Gera o recibo em PDF da venda e abre o compartilhar do celular (ou baixa no computador). */
export function ReceiptButton({
  sale,
  info,
  variant = "soft",
  label = "Recibo PDF",
}: {
  sale: Sale;
  info: ReceiptInfo;
  variant?: "soft" | "outline" | "ghost";
  label?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const blob = await buildReceiptPdf(sale, info);
      const slug = (sale.pointName || "cliente").normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      const result = await shareOrDownloadPdf(blob, `recibo-${slug}-${receiptNumber(sale)}.pdf`);
      if (result === "downloaded") toast({ title: "Recibo gerado", description: "O PDF foi baixado no aparelho." });
    } catch {
      toast({ title: "Não foi possível gerar o recibo", description: "Tente de novo.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant={variant} loading={busy} icon={<FileText className="size-4" />} onClick={() => void run()}>
      {label}
    </Button>
  );
}
