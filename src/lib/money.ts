/** Dinheiro sempre em centavos inteiros: nada de 0,1 + 0,2 = 0,30000000000000004. */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 123456 -> "R$ 1.234,56" */
export const formatMoney = (cents: number): string => brl.format(cents / 100);

/** Para eixos de gráfico: "R$ 1,2 mil" a partir de R$ 10 mil; abaixo disso o valor inteiro. */
export const formatMoneyAxis = (cents: number): string =>
  Math.abs(cents) >= 1_000_000 ? brlCompact.format(cents / 100) : brl.format(Math.round(cents / 100)).replace(/,00$/, "");

/** Valor do campo com máscara de centavos: só dígitos, os dois últimos são os centavos. "1250" -> 1250 (R$ 12,50). */
export function parseMoneyDigits(text: string): number {
  const digits = text.replace(/\D/g, "").slice(0, 9);
  return digits ? Number(digits) : 0;
}

/** 1250 -> "12,50" (o que aparece dentro do campo, sem "R$"). */
export const formatMoneyInput = (cents: number): string =>
  (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
