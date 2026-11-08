import { describe, expect, it } from "vitest";
import { buildDailySummary, buildSalesCsv } from "./export";
import { defaultFilters, matchesFilters, periodStart } from "./filters";
import { amountFor, computeFinance, priceMap, saleAmount } from "./finance";
import { formatMoney } from "./money";
import { buildBuckets, granularityFor, niceScale } from "./series";
import { computeDashboard } from "./stats";
import type { Expense, Route, Sale, Seller } from "./types";

const TODAY = "2026-11-07"; // sábado

const mk = (over: Partial<Sale>): Sale => ({
  id: crypto.randomUUID(),
  routeId: "r1",
  pointName: "",
  sellerId: "joao",
  saleDate: TODAY,
  note: "",
  items: { simples: 10 },
  total: 10,
  createdAt: `${over.saleDate ?? TODAY}T12:00:00`,
  deletedAt: null,
  dirty: 0,
  ...over,
});
const routes: Route[] = [{ id: "r1", name: "Norte", cities: [], createdAt: "", dirty: 0 }];
const prices = { simples: 250, cobertura: 400, cremosinho: 200 };
const sellers: Seller[] = [
  { id: "joao", name: "João", role: "Sócio", pinHash: "" },
  { id: "pedro", name: "Pedro", role: "CEO", pinHash: "" },
];

describe("filtros", () => {
  it("início de cada período", () => {
    expect(periodStart("today", TODAY)).toBe(TODAY);
    expect(periodStart("7d", TODAY)).toBe("2026-11-01");
    expect(periodStart("month", TODAY)).toBe("2026-11-01");
    expect(periodStart("all", TODAY)).toBe("");
  });
  it("aplica período, rota e vendedor; despesa sem rota passa no filtro de rota", () => {
    const f = { ...defaultFilters("7d"), routeId: "r1", sellerId: "joao" };
    expect(matchesFilters({ date: TODAY, routeId: "r1", sellerId: "joao" }, f, TODAY)).toBe(true);
    expect(matchesFilters({ date: "2026-10-31", routeId: "r1", sellerId: "joao" }, f, TODAY)).toBe(false);
    expect(matchesFilters({ date: TODAY, routeId: "r2", sellerId: "joao" }, f, TODAY)).toBe(false);
    expect(matchesFilters({ date: TODAY, sellerId: "joao" }, f, TODAY)).toBe(true);
  });
});

describe("gráficos", () => {
  it("escala do eixo X pelo tamanho do intervalo", () => {
    expect(granularityFor(TODAY, TODAY)).toBe("hour");
    expect(granularityFor("2026-11-01", TODAY)).toBe("day");
    expect(granularityFor("2026-01-01", TODAY)).toBe("month");
  });
  it("dias sem venda entram com zero, na ordem", () => {
    const { buckets } = buildBuckets([{ date: "2026-11-03" }, { date: "2026-11-03" }, { date: TODAY }], "2026-11-01", TODAY, 1, () => [5]);
    expect(buckets).toHaveLength(7);
    expect(buckets.map((b) => b.values[0])).toEqual([0, 0, 10, 0, 0, 0, 5]);
  });
  it("agrupa por mês em intervalos longos", () => {
    const { buckets } = buildBuckets([{ date: "2026-09-10" }, { date: "2026-11-02" }], "2026-08-15", TODAY, 1, () => [1]);
    expect(buckets.map((b) => b.key)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(buckets.map((b) => b.values[0])).toEqual([0, 1, 0, 1]);
  });
  it("teto redondo do eixo", () => {
    expect(niceScale(87).max).toBe(100);
    expect(niceScale(87).ticks).toEqual([0, 50, 100]);
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0] });
  });
});

describe("financeiro", () => {
  const defaults = priceMap([
    { productId: "simples", priceCents: 300, dirty: 0 },
    { productId: "cobertura", priceCents: 450, dirty: 0 },
  ]);
  it("venda com preço próprio usa o preço dela; venda antiga usa o preço padrão", () => {
    const priced = mk({ items: { simples: 2 }, total: 2, unitPrices: { simples: 500 }, amountCents: 1000 });
    const legacy = mk({ items: { simples: 2, cobertura: 1 }, total: 3 });
    expect(saleAmount(priced, defaults)).toBe(1000);
    expect(saleAmount(legacy, defaults)).toBe(2 * 300 + 450);
    expect(amountFor({ simples: 3 }, { simples: 333 })).toBe(999);
  });
  it("saldo = entradas - gastos, com gastos por categoria", () => {
    const e = (amountCents: number, category: Expense["category"]): Expense => ({
      id: crypto.randomUUID(), description: "x", category, amountCents, expenseDate: TODAY, sellerId: "joao", note: "", createdAt: "", deletedAt: null, dirty: 0,
    });
    const r = computeFinance([mk({ items: { simples: 10 }, total: 10 })], [e(1000, "combustivel"), e(500, "outros"), e(200, "combustivel")], defaults);
    expect(r).toMatchObject({ incomeCents: 3000, expenseCents: 1700, balanceCents: 1300, estimatedSales: 1 });
    expect(r.byCategory[0]).toMatchObject({ id: "combustivel", cents: 1200 });
  });
});

describe("painel", () => {
  it("totais do período e variação contra o período anterior", () => {
    const sales = [
      mk({ total: 10 }),
      mk({ total: 5, sellerId: "pedro", items: { cobertura: 5 } }),
      mk({ saleDate: "2026-11-06", total: 30 }), // ontem
    ];
    const today = computeDashboard(sales, defaultFilters("today"), TODAY, priceMap([]), routes, sellers);
    expect(today).toMatchObject({ packages: 15, count: 2, deltaPackages: -50 });
    expect(today.bySeller.find((s) => s.id === "pedro")?.value).toBe(5);
    expect(today.byProduct.find((p) => p.id === "cobertura")?.value).toBe(5);

    const week = computeDashboard(sales, defaultFilters("7d"), TODAY, priceMap([]), routes, sellers);
    expect(week.packages).toBe(45);
    expect(week.deltaPackages).toBeNull(); // nada nos 7 dias anteriores
  });
  it("mês até hoje compara com os mesmos dias do mês passado", () => {
    const sales = [mk({ saleDate: "2026-11-03", total: 20 }), mk({ saleDate: "2026-10-05", total: 10 }), mk({ saleDate: "2026-10-20", total: 99 })];
    const d = computeDashboard(sales, defaultFilters("month"), TODAY, priceMap([]), routes, sellers);
    expect(d.packages).toBe(20);
    expect(d.deltaPackages).toBe(100); // 20 vs 10 (o dia 20/10 fica fora: depois do dia 7)
  });
  it("rota excluída continua com nome nos totais", () => {
    const d = computeDashboard([mk({ routeId: "r1" })], defaultFilters("today"), TODAY, priceMap([]), [{ ...routes[0]!, deletedAt: "x" }], sellers);
    expect(d.byRoute[0]?.label).toBe("Norte");
  });
});

describe("exportação", () => {
  it("CSV com ; e BOM, uma linha por venda", () => {
    const csv = buildSalesCsv([mk({ pointName: 'Bar "do Zé"; centro' })], routes, sellers);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Bar ""do Zé""; centro"');
  });
  it("resumo do WhatsApp soma só o dia", () => {
    const text = buildDailySummary(TODAY, [mk({ total: 10 }), mk({ saleDate: "2026-11-06", total: 99 })], routes, prices);
    expect(text).toContain("Total: 10 pacotes");
    expect(text).toContain("*Norte* — 10 pacotes");
  });
  it("resumo do WhatsApp traz emoji por produto e o valor de cada rota", () => {
    const two: Route[] = [...routes, { id: "r2", name: "Sul", cities: [], createdAt: "", dirty: 0 }];
    const text = buildDailySummary(
      TODAY,
      [
        mk({ items: { simples: 10, cobertura: 2 }, total: 12, unitPrices: { simples: 300, cobertura: 500 }, amountCents: 4000 }),
        mk({ routeId: "r2", items: { cremosinho: 4 }, total: 4 }),
      ],
      two,
      prices,
    );
    expect(text).toContain(`*Total: 16 pacotes · ${formatMoney(4800)}*`);
    expect(text).toContain("🍧 Picolé Simples: 10");
    expect(text).toContain(`📍 *Norte* — 12 pacotes · ${formatMoney(4000)}`);
    expect(text).toContain("   🍫 Picolé de Cobertura: 2");
    expect(text).toContain(`📍 *Sul* — 4 pacotes · ${formatMoney(800)}`);
    expect(text).toContain("   🍨 Cremosinho: 4");
  });
});
