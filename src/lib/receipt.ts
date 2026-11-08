import { hasUnitPrices } from "./finance";
import { formatShortDate, formatTime } from "./format";
import { formatMoney } from "./money";
import { paymentMethodLabel } from "./payment";
import { PRODUCTS } from "./products";
import type { ProductId, Sale } from "./types";

export interface ReceiptInfo {
  routeName: string;
  sellerName: string;
  /** preço padrão, para vendas antigas sem preço próprio */
  defaults: Record<ProductId, number>;
}

/** Número curto e estável do recibo (vem do UUID da venda). */
export const receiptNumber = (sale: Pick<Sale, "id">): string => sale.id.replace(/-/g, "").slice(0, 8).toUpperCase();

/** Linhas do recibo: produto, quantidade, preço por pacote e subtotal (centavos). */
export function receiptLines(sale: Sale, defaults: Record<ProductId, number>) {
  const prices = hasUnitPrices(sale) ? (sale.unitPrices ?? {}) : defaults;
  return PRODUCTS.filter((p) => (sale.items[p.id] ?? 0) > 0).map((p) => {
    const qty = sale.items[p.id] ?? 0;
    const unit = prices[p.id] ?? 0;
    return { name: p.name, qty, unit, subtotal: qty * unit };
  });
}

/** Situação do pagamento como aparece no recibo. */
export function receiptPayment(sale: Sale): string {
  if (sale.paymentStatus === "pendente") return "A receber (pendente)";
  if (sale.paidAt) return `Pago em ${formatShortDate(sale.paidAt.slice(0, 10))} (${paymentMethodLabel(sale.paymentMethod)})`;
  return sale.paymentMethod ? `Pago (${paymentMethodLabel(sale.paymentMethod)})` : "Pago";
}

// O PDF usa fontes padrão (Latin-1): espaço inseparável do Intl vira espaço comum.
const money = (cents: number) => formatMoney(cents).replace(/ /g, " ");

async function loadImage(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null; // sem o logo (ex.: offline antes do primeiro cache): o recibo sai com o nome escrito
  }
}

const NAVY: [number, number, number] = [11, 27, 77];
const GOLD: [number, number, number] = [245, 166, 35];
const INK: [number, number, number] = [30, 30, 30];
const MUTED: [number, number, number] = [110, 110, 110];

/** Recibo de venda em PDF (80 mm, formato de cupom), com o logo da distribuidora. */
export async function buildReceiptPdf(sale: Sale, info: ReceiptInfo): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const lines = receiptLines(sale, info.defaults);
  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);

  const W = 80;
  const M = 6;
  const height = 132 + lines.length * 7 + (sale.note ? 14 : 0);
  const doc = new jsPDF({ unit: "mm", format: [W, height] });
  doc.setProperties({ title: `Recibo ${receiptNumber(sale)} - Maxbono Sorvetes`, creator: "Maxbono Sorvetes" });

  // Cabeçalho azul com o logo
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 40, "F");
  const logo = await loadImage("/brand/logo-receipt.jpg");
  if (logo) {
    doc.addImage(logo, "JPEG", (W - 50) / 2, 3, 50, 34);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Maxbono Sorvetes", W / 2, 22, { align: "center" });
  }
  doc.setFillColor(...GOLD);
  doc.rect(0, 40, W, 1.2, "F");

  let y = 50;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RECIBO DE VENDA", W / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Nº ${receiptNumber(sale)}  ·  ${formatShortDate(sale.saleDate)} às ${formatTime(sale.createdAt)}`, W / 2, y, { align: "center" });

  const row = (label: string, value: string) => {
    y += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    const text = doc.splitTextToSize(value || "-", W - M - 26) as string[];
    doc.text(text, M + 20, y);
    y += (text.length - 1) * 4;
  };
  y += 3;
  row("Cliente", sale.pointName);
  row("Rota", info.routeName);
  row("Vendedor", info.sellerName);

  const rule = () => {
    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(M, y, W - M, y);
    doc.setLineDashPattern([], 0);
  };
  rule();

  // Itens
  const col = { qty: 44, unit: 58, sub: W - M };
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...MUTED);
  doc.text("PRODUTO", M, y);
  doc.text("QTD", col.qty, y, { align: "right" });
  doc.text("UNIT.", col.unit, y, { align: "right" });
  doc.text("TOTAL", col.sub, y, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  for (const l of lines) {
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(l.name, M, y);
    doc.text(String(l.qty), col.qty, y, { align: "right" });
    doc.text(money(l.unit), col.unit, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(money(l.subtotal), col.sub, y, { align: "right" });
  }
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`${sale.total} ${sale.total === 1 ? "pacote" : "pacotes"}`, M, y);
  rule();

  // Total
  y += 9;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", M, y);
  doc.setFontSize(16);
  doc.text(money(total), W - M, y, { align: "right" });
  y += 6;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(sale.paymentStatus === "pendente" ? ([190, 40, 40] as [number, number, number]) : INK));
  doc.text(`Pagamento: ${receiptPayment(sale)}`, M, y);

  if (sale.note) {
    y += 7;
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(`Obs.: ${sale.note}`, W - 2 * M) as string[], M, y);
  }

  y = height - 12;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Obrigado pela preferência!", W / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text("Maxbono Sorvetes Distribuidora  ·  Documento sem valor fiscal", W / 2, y + 4.5, { align: "center" });

  return doc.output("blob");
}

/** No celular abre o "Compartilhar" (WhatsApp, e-mail...); no computador baixa o arquivo. */
export async function shareOrDownloadPdf(blob: Blob, filename: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // Compartilhar falhou por outro motivo: cai no download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
