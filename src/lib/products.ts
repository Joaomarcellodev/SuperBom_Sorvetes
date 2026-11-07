import type { ProductId, SaleItems } from "./types";

export interface Product {
  id: ProductId;
  name: string;
  short: string;
}

/** Os três tipos vendidos hoje. Para criar outro, basta incluir aqui (items é jsonb no banco). */
export const PRODUCTS: readonly Product[] = [
  { id: "simples", name: "Picolé Simples", short: "Simples" },
  { id: "cobertura", name: "Picolé de Cobertura", short: "Cobertura" },
  { id: "cremosinho", name: "Cremosinho", short: "Cremosinho" },
] as const;

export const emptyItems = (): Record<ProductId, number> => ({
  simples: 0,
  cobertura: 0,
  cremosinho: 0,
});

export const sumItems = (items: SaleItems): number =>
  PRODUCTS.reduce((acc, p) => acc + (items[p.id] ?? 0), 0);

/** "10 Simples, 8 Cobertura" */
export const describeItems = (items: SaleItems): string =>
  PRODUCTS.filter((p) => (items[p.id] ?? 0) > 0)
    .map((p) => `${items[p.id]} ${p.short}`)
    .join(", ");
