import { addDays, startOfMonth, startOfWeek } from "./format";
import { PRODUCTS } from "./products";
import type { ProductId, Sale } from "./types";

const sumTotal = (sales: Sale[]) => sales.reduce((acc, s) => acc + s.total, 0);

export interface DashboardStats {
  today: number;
  yesterday: number;
  week: number;
  month: number;
  /** variação de hoje contra ontem, em %; null quando ontem foi zero */
  deltaVsYesterday: number | null;
  byProductToday: Array<{ id: ProductId; name: string; packages: number; share: number }>;
}

export function computeDashboardStats(sales: Sale[], today: string): DashboardStats {
  const yesterdayStr = addDays(today, -1);
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);

  const todaySales = sales.filter((s) => s.saleDate === today);
  const todayTotal = sumTotal(todaySales);
  const yesterdayTotal = sumTotal(sales.filter((s) => s.saleDate === yesterdayStr));

  const byProductToday = PRODUCTS.map((p) => {
    const packages = todaySales.reduce((acc, s) => acc + (s.items[p.id] ?? 0), 0);
    return {
      id: p.id,
      name: p.name,
      packages,
      share: todayTotal > 0 ? Math.round((packages / todayTotal) * 100) : 0,
    };
  });

  return {
    today: todayTotal,
    yesterday: yesterdayTotal,
    week: sumTotal(sales.filter((s) => s.saleDate >= weekStart && s.saleDate <= today)),
    month: sumTotal(sales.filter((s) => s.saleDate >= monthStart && s.saleDate <= today)),
    deltaVsYesterday:
      yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : null,
    byProductToday,
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
