import { toDateStr } from "./format";
import { PRODUCTS } from "./products";
import type { Expense, ExpenseCategory, ProductId, ProductPrice, Sale, UnitPrices } from "./types";

export const EXPENSE_CATEGORIES: ReadonlyArray<{ id: ExpenseCategory; label: string }> = [
  { id: "combustivel", label: "Combustível" },
  { id: "reposicao", label: "Reposição" },
  { id: "manutencao", label: "Manutenção" },
  { id: "alimentacao", label: "Alimentação" },
  { id: "pessoal", label: "Ajudante / pessoal" },
  { id: "embalagem", label: "Embalagem / gelo" },
  { id: "outros", label: "Outros" },
];

export const categoryLabel = (id: string): string => EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? "Outros";

/** Tabela de preços padrão como mapa (produto sem cadastro = 0). */
export function priceMap(prices: ProductPrice[] | undefined): Record<ProductId, number> {
  const map = { simples: 0, cobertura: 0, cremosinho: 0 } as Record<ProductId, number>;
  for (const p of prices ?? []) map[p.productId] = p.priceCents;
  return map;
}

export const hasUnitPrices = (sale: Pick<Sale, "unitPrices">): boolean =>
  Boolean(sale.unitPrices && Object.keys(sale.unitPrices).length > 0);

/** Pacotes × preço. */
export const amountFor = (items: Sale["items"], unitPrices: UnitPrices): number =>
  PRODUCTS.reduce((acc, p) => acc + (items[p.id] ?? 0) * (unitPrices[p.id] ?? 0), 0);

/**
 * Valor de uma venda. Vendas registradas com preço usam o preço daquela venda;
 * vendas antigas (de antes do financeiro) usam o preço padrão atual.
 */
export const saleAmount = (sale: Sale, defaults: Record<ProductId, number>): number =>
  hasUnitPrices(sale) ? (sale.amountCents ?? amountFor(sale.items, sale.unitPrices ?? {})) : amountFor(sale.items, defaults);

/** Pendência em aberto: o cliente levou e ainda não pagou. Vendas antigas (sem o campo) contam como pagas. */
export const isOpenDebt = (sale: Pick<Sale, "paymentStatus" | "deletedAt">): boolean =>
  sale.paymentStatus === "pendente" && !sale.deletedAt;

/** Valor que já entrou no caixa: pendência em aberto vale 0 até alguém tocar em "Receber". */
export const receivedAmount = (sale: Sale, defaults: Record<ProductId, number>): number =>
  isOpenDebt(sale) ? 0 : saleAmount(sale, defaults);

/** Dia em que o dinheiro entrou: pendência quitada conta no dia do pagamento, não no da venda. */
export const incomeDate = (sale: Pick<Sale, "saleDate" | "paidAt">): string =>
  sale.paidAt ? toDateStr(new Date(sale.paidAt)) : sale.saleDate;

export const sumExpenses = (list: Expense[]): number => list.reduce((acc, e) => acc + e.amountCents, 0);

export interface FinanceSummary {
  /** só o que já foi pago (pendências em aberto ficam de fora) */
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** vendas antigas, sem preço próprio, valoradas pelo preço padrão atual */
  estimatedSales: number;
  byCategory: Array<{ id: ExpenseCategory; label: string; cents: number }>;
}

export function computeFinance(sales: Sale[], expenses: Expense[], defaults: Record<ProductId, number>): FinanceSummary {
  const incomeCents = sales.reduce((acc, s) => acc + receivedAmount(s, defaults), 0);
  const expenseCents = sumExpenses(expenses);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    cents: sumExpenses(expenses.filter((e) => e.category === c.id)),
  }))
    .filter((c) => c.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  return {
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    estimatedSales: sales.filter((s) => !hasUnitPrices(s)).length,
    byCategory,
  };
}
