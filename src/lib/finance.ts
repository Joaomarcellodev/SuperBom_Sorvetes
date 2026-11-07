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

export const sumExpenses = (list: Expense[]): number => list.reduce((acc, e) => acc + e.amountCents, 0);

export interface FinanceSummary {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** vendas antigas, sem preço próprio, valoradas pelo preço padrão atual */
  estimatedSales: number;
  byCategory: Array<{ id: ExpenseCategory; label: string; cents: number }>;
}

export function computeFinance(sales: Sale[], expenses: Expense[], defaults: Record<ProductId, number>): FinanceSummary {
  const incomeCents = sales.reduce((acc, s) => acc + saleAmount(s, defaults), 0);
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
