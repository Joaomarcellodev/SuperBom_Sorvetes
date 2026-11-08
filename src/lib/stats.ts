import { matchesFilters, periodStart, type Filters } from "./filters";
import { incomeDate, receivedAmount } from "./finance";
import { addDays, parseDateStr, startOfMonth } from "./format";
import { PRODUCTS } from "./products";
import { buildBuckets, type Bucket } from "./series";
import type { ProductId, Route, Sale, Seller } from "./types";

const sumTotal = (sales: Sale[]) => sales.reduce((acc, s) => acc + s.total, 0);

/** Variação percentual; null quando não há base (anterior = 0). */
const delta = (now: number, before: number): number | null =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null;

/** Janela anterior de mesmo tamanho, para comparar (hoje x ontem, 7 dias x 7 dias antes, mês x mês passado). */
function previousWindow(filters: Filters, today: string): { from: string; to: string } | null {
  if (filters.period === "today") {
    const y = addDays(today, -1);
    return { from: y, to: y };
  }
  if (filters.period === "7d") return { from: addDays(today, -13), to: addDays(today, -7) };
  if (filters.period === "month") {
    // Mês até hoje x mesmos dias do mês passado.
    const start = parseDateStr(startOfMonth(today));
    start.setMonth(start.getMonth() - 1);
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
    const day = Number(today.slice(8));
    const lastOfPrev = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return { from, to: `${from.slice(0, 8)}${String(Math.min(day, lastOfPrev)).padStart(2, "0")}` };
  }
  return null;
}

export interface Dashboard {
  packages: number;
  amountCents: number;
  count: number;
  avgPackages: number;
  deltaPackages: number | null;
  deltaAmount: number | null;
  buckets: Bucket[];
  byProduct: Array<{ id: ProductId; label: string; value: number }>;
  byRoute: Array<{ id: string; label: string; value: number }>;
  bySeller: Array<{ id: string; label: string; value: number }>;
}

export function computeDashboard(
  sales: Sale[],
  filters: Filters,
  today: string,
  defaults: Record<ProductId, number>,
  routes: Route[],
  sellers: Seller[],
): Dashboard {
  const inView = sales.filter((s) => matchesFilters({ date: s.saleDate, routeId: s.routeId, sellerId: s.sellerId }, filters, today));
  const packages = sumTotal(inView);
  // Dinheiro: só o que já foi pago, no dia em que entrou (pendência quitada conta no dia do pagamento).
  const paidInView = sales.filter((s) => matchesFilters({ date: incomeDate(s), routeId: s.routeId, sellerId: s.sellerId }, filters, today));
  const amountCents = paidInView.reduce((acc, s) => acc + receivedAmount(s, defaults), 0);

  const prev = previousWindow(filters, today);
  const inWindow = (date: string, s: Sale) =>
    prev !== null &&
    date >= prev.from &&
    date <= prev.to &&
    (!filters.routeId || s.routeId === filters.routeId) &&
    (!filters.sellerId || s.sellerId === filters.sellerId);
  const before = sales.filter((s) => inWindow(s.saleDate, s));
  const amountBefore = sales.filter((s) => inWindow(incomeDate(s), s)).reduce((acc, s) => acc + receivedAmount(s, defaults), 0);

  const from = periodStart(filters.period, today) || inView.map((s) => s.saleDate).sort()[0] || today;
  const { buckets } = buildBuckets(
    inView.map((s) => ({ date: s.saleDate, createdAt: s.createdAt, total: s.total })),
    from,
    today,
    1,
    (x) => [x.total],
  );

  const group = <K extends string>(key: (s: Sale) => K, label: (k: K) => string) => {
    const map = new Map<K, number>();
    for (const s of inView) map.set(key(s), (map.get(key(s)) ?? 0) + s.total);
    return [...map.entries()].map(([id, value]) => ({ id, label: label(id), value }));
  };

  return {
    packages,
    amountCents,
    count: inView.length,
    avgPackages: inView.length ? Math.round((packages / inView.length) * 10) / 10 : 0,
    deltaPackages: prev ? delta(packages, sumTotal(before)) : null,
    deltaAmount: prev ? delta(amountCents, amountBefore) : null,
    buckets,
    byProduct: PRODUCTS.map((p) => ({ id: p.id, label: p.name, value: inView.reduce((acc, s) => acc + (s.items[p.id] ?? 0), 0) })),
    byRoute: group((s) => s.routeId, (id) => routes.find((r) => r.id === id)?.name ?? "Rota removida"),
    bySeller: group((s) => s.sellerId, (id) => sellers.find((x) => x.id === id)?.name ?? "—"),
  };
}

export function groupByDay(sales: Sale[]): Array<{ date: string; total: number; sales: Sale[] }> {
  const map = new Map<string, Sale[]>();
  for (const s of sales) {
    const list = map.get(s.saleDate);
    if (list) list.push(s);
    else map.set(s.saleDate, [s]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, list]) => ({
      date,
      total: sumTotal(list),
      sales: list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }));
}
