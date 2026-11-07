import { getDb } from "./db";
import { amountFor } from "./finance";
import { PRODUCTS, sumItems } from "./products";
import type { Expense, ExpenseCategory, ProductId, Route, RoutePoint, Sale, SaleItems, UnitPrices } from "./types";

/** Escritas locais. Nada aqui precisa de internet. */

export interface NewSaleInput {
  routeId: string;
  pointName: string;
  sellerId: string;
  saleDate: string;
  note: string;
  items: SaleItems;
  /** preço por pacote usado nesta venda (vem do preço padrão, pode ser ajustado) */
  unitPrices: UnitPrices;
}

export async function saveSale(input: NewSaleInput): Promise<Sale> {
  const db = getDb();
  const total = sumItems(input.items);
  if (total <= 0) throw new Error("Informe ao menos 1 pacote.");

  const pointName = input.pointName.trim();
  const items: SaleItems = Object.fromEntries(Object.entries(input.items).filter(([, qty]) => (qty ?? 0) > 0));
  // Guarda o preço de todos os produtos vendidos (mesmo R$ 0): marca a venda como "com preço próprio".
  const unitPrices: UnitPrices = Object.fromEntries(
    PRODUCTS.filter((p) => (items[p.id] ?? 0) > 0).map((p) => [p.id, Math.max(0, Math.round(input.unitPrices[p.id] ?? 0))]),
  );
  const sale: Sale = {
    id: crypto.randomUUID(),
    routeId: input.routeId,
    pointName,
    sellerId: input.sellerId,
    saleDate: input.saleDate,
    note: input.note.trim(),
    items,
    total,
    unitPrices,
    amountCents: amountFor(items, unitPrices),
    createdAt: new Date().toISOString(),
    deletedAt: null,
    dirty: 1,
  };

  await db.transaction("rw", db.sales, db.points, async () => {
    await db.sales.add(sale);
    // Ponto digitado pela primeira vez vira cadastro daquela rota.
    if (pointName) {
      const known = await db.points
        .where("routeId")
        .equals(input.routeId)
        .filter((p) => p.name.toLowerCase() === pointName.toLowerCase())
        .count();
      if (known === 0) {
        const point: RoutePoint = { id: crypto.randomUUID(), routeId: input.routeId, name: pointName, dirty: 1 };
        await db.points.add(point);
      }
    }
  });
  return sale;
}

/** Exclusão lógica: a venda some das telas, mas o apagar também precisa chegar ao outro aparelho. */
export async function deleteSale(id: string): Promise<void> {
  await getDb().sales.update(id, { deletedAt: new Date().toISOString(), dirty: 1 });
}

/** Troca (ou remove, com null) a foto do perfil. Fica no aparelho e sobe na próxima sincronização. */
export async function updateSellerAvatar(sellerId: string, avatarUrl: string | null): Promise<void> {
  await getDb().sellers.update(sellerId, { avatarUrl, avatarDirty: 1 });
}

/** Preço padrão de um produto (centavos). Sincroniza com o sócio. */
export async function setProductPrice(productId: ProductId, priceCents: number): Promise<void> {
  await getDb().prices.put({ productId, priceCents: Math.max(0, Math.round(priceCents)), dirty: 1 });
}

export interface NewExpenseInput {
  description: string;
  category: ExpenseCategory;
  amountCents: number;
  expenseDate: string;
  sellerId: string;
  note: string;
}

export async function saveExpense(input: NewExpenseInput): Promise<Expense> {
  const description = input.description.trim();
  if (!description) throw new Error("Descreva o gasto (ex.: gasolina da rota).");
  if (input.amountCents <= 0) throw new Error("Informe o valor do gasto.");
  const expense: Expense = {
    id: crypto.randomUUID(),
    description,
    category: input.category,
    amountCents: Math.round(input.amountCents),
    expenseDate: input.expenseDate,
    sellerId: input.sellerId,
    note: input.note.trim(),
    createdAt: new Date().toISOString(),
    deletedAt: null,
    dirty: 1,
  };
  await getDb().expenses.add(expense);
  return expense;
}

/** Exclusão lógica, como nas vendas. */
export async function deleteExpense(id: string): Promise<void> {
  await getDb().expenses.update(id, { deletedAt: new Date().toISOString(), dirty: 1 });
}

/** Nome repetido entre as rotas ativas (ignorando a própria rota ao editar). */
async function assertUniqueRouteName(name: string, exceptId?: string): Promise<void> {
  const taken = await getDb()
    .routes.filter((r) => !r.deletedAt && r.id !== exceptId && r.name.toLowerCase() === name.toLowerCase())
    .count();
  if (taken > 0) throw new Error("Já existe uma rota com esse nome.");
}

const cleanCities = (cities: string[]) => cities.map((c) => c.trim()).filter(Boolean);

export async function updateRoute(id: string, name: string, cities: string[]): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Dê um nome para a rota.");
  await assertUniqueRouteName(cleanName, id);
  await getDb().routes.update(id, { name: cleanName, cities: cleanCities(cities), dirty: 1 });
}

/** Exclusão lógica: a rota some das listas, mas as vendas antigas continuam mostrando o nome dela. */
export async function deleteRoute(id: string): Promise<void> {
  await getDb().routes.update(id, { deletedAt: new Date().toISOString(), dirty: 1 });
}

export async function restoreRoute(id: string): Promise<void> {
  const db = getDb();
  const route = await db.routes.get(id);
  if (!route) return;
  await assertUniqueRouteName(route.name, id);
  await db.routes.update(id, { deletedAt: null, dirty: 1 });
}

export async function createRoute(name: string, cities: string[]): Promise<Route> {
  const db = getDb();
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Dê um nome para a rota.");
  await assertUniqueRouteName(cleanName);

  const route: Route = {
    id: crypto.randomUUID(),
    name: cleanName,
    cities: cleanCities(cities),
    createdAt: new Date().toISOString(),
    deletedAt: null,
    dirty: 1,
  };
  await db.routes.add(route);
  return route;
}

/** Libera espaço no aparelho: remove só vendas antigas que JÁ foram enviadas ao Supabase. */
export async function purgeSyncedBefore(dateStr: string): Promise<number> {
  const db = getDb();
  const ids = await db.sales
    .where("saleDate")
    .below(dateStr)
    .filter((s) => s.dirty === 0)
    .primaryKeys();
  await db.sales.bulkDelete(ids);
  return ids.length;
}
