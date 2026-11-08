import { incomeDate, isOpenDebt, saleAmount } from "./finance";
import { formatShortDate, formatTime } from "./format";
import type { PaymentMethod, ProductId, Sale } from "./types";

export const PAYMENT_METHODS: ReadonlyArray<{ id: PaymentMethod; label: string }> = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
];

export const paymentMethodLabel = (id: PaymentMethod | null | undefined): string =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? "Não informado";

export { isOpenDebt };

/** Soma do que falta receber. */
export const openDebtCents = (sales: Sale[], defaults: Record<ProductId, number>): number =>
  sales.filter(isOpenDebt).reduce((acc, s) => acc + saleAmount(s, defaults), 0);

/** "Paga em 08/11/2026 às 15:00 · PIX" (pendência quitada) ou "PIX" (paga na hora). */
export function paymentDescription(sale: Pick<Sale, "paymentMethod" | "paidAt" | "saleDate">): string {
  const method = paymentMethodLabel(sale.paymentMethod);
  if (!sale.paidAt) return method;
  return `Paga em ${formatShortDate(incomeDate(sale))} às ${formatTime(sale.paidAt)} · ${method}`;
}

/** Assinatura do que a sincronização envia de uma venda: mudou durante o envio = continua pendente. */
export const saleSignature = (s: Pick<Sale, "deletedAt" | "paymentStatus" | "paymentMethod" | "paidAt">): string =>
  `${s.deletedAt ?? ""}|${s.paymentStatus ?? "pago"}|${s.paymentMethod ?? ""}|${s.paidAt ?? ""}`;
