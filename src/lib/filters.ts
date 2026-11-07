import { addDays, startOfMonth } from "./format";

export type Period = "today" | "7d" | "month" | "all";

export const PERIODS: ReadonlyArray<{ id: Period; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "month", label: "Mês" },
  { id: "all", label: "Tudo" },
];

export interface Filters {
  period: Period;
  /** "" = todas */
  routeId: string;
  /** "" = todos */
  sellerId: string;
}

export const defaultFilters = (period: Period = "7d"): Filters => ({ period, routeId: "", sellerId: "" });

/** Primeiro dia (YYYY-MM-DD) do período; "" quando é "Tudo". */
export function periodStart(period: Period, today: string): string {
  if (period === "today") return today;
  if (period === "7d") return addDays(today, -6);
  if (period === "month") return startOfMonth(today);
  return "";
}

export const periodLabel = (period: Period): string => PERIODS.find((p) => p.id === period)?.label ?? "";

/** Serve para vendas e despesas: qualquer item com data, e opcionalmente rota e vendedor. */
export function matchesFilters(
  item: { date: string; routeId?: string; sellerId?: string },
  f: Filters,
  today: string,
): boolean {
  if (item.date < periodStart(f.period, today)) return false;
  if (f.routeId && item.routeId !== undefined && item.routeId !== f.routeId) return false;
  if (f.sellerId && item.sellerId !== undefined && item.sellerId !== f.sellerId) return false;
  return true;
}

/** Quantos filtros além do período estão ligados (para o contador do botão). */
export const activeExtraFilters = (f: Filters): number => Number(Boolean(f.routeId)) + Number(Boolean(f.sellerId));
