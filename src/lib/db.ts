import Dexie, { type Table } from "dexie";
import type { MetaRow, Route, RoutePoint, Sale, Seller } from "./types";

/**
 * Banco local (IndexedDB). É a fonte da verdade da interface:
 * toda leitura e escrita acontece aqui, com ou sem internet.
 * O Supabase é só o espelho que une os aparelhos dos dois sócios.
 */
class SuperbomDB extends Dexie {
  sellers!: Table<Seller, string>;
  routes!: Table<Route, string>;
  points!: Table<RoutePoint, string>;
  sales!: Table<Sale, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("superbom");
    this.version(1).stores({
      sellers: "id",
      routes: "id, name, dirty",
      points: "id, routeId, [routeId+name], dirty",
      sales: "id, saleDate, routeId, sellerId, dirty, createdAt",
      meta: "key",
    });
  }
}

let instance: SuperbomDB | null = null;

/** Abre o banco só no navegador (no servidor do Next não existe IndexedDB). */
export function getDb(): SuperbomDB {
  if (typeof window === "undefined") {
    throw new Error("O banco local só existe no navegador.");
  }
  instance ??= new SuperbomDB();
  return instance;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await getDb().meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await getDb().meta.put({ key, value });
}

export const META_LAST_SYNC = "lastSyncAt";
export const META_SALES_CURSOR = "salesCursor";
