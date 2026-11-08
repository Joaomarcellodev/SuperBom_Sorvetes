import { saleAmount } from "./finance";
import type { PaymentMethod, ProductId, Sale } from "./types";

export const PAYMENT_METHODS: ReadonlyArray<{ id: PaymentMethod; label: string }> = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
];

export const paymentMethodLabel = (id: PaymentMethod | null | undefined): string =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? "Não informado";

/** Pendência em aberto: o cliente levou e ainda não pagou. Vendas antigas (sem o campo) contam como pagas. */
export const isOpenDebt = (sale: Pick<Sale, "paymentStatus" | "deletedAt">): boolean =>
  sale.paymentStatus === "pendente" && !sale.deletedAt;

/** Soma do que falta receber. */
export const openDebtCents = (sales: Sale[], defaults: Record<ProductId, number>): number =>
  sales.filter(isOpenDebt).reduce((acc, s) => acc + saleAmount(s, defaults), 0);

/** Assinatura do que a sincronização envia de uma venda: mudou durante o envio = continua pendente. */
export const saleSignature = (s: Pick<Sale, "deletedAt" | "paymentStatus" | "paymentMethod" | "paidAt">): string =>
  `${s.deletedAt ?? ""}|${s.paymentStatus ?? "pago"}|${s.paymentMethod ?? ""}|${s.paidAt ?? ""}`;
