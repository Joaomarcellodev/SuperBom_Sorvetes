import { saleAmount } from "./finance";
import { formatShortDate, formatTime } from "./format";
import { formatMoney } from "./money";
import { PRODUCTS } from "./products";
import type { ProductId, Route, Sale, Seller } from "./types";

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV com ";" e BOM: abre direto no Excel em português, com acentos corretos. */
export function buildSalesCsv(sales: Sale[], routes: Route[], sellers: Seller[]): string {
  const routeName = new Map(routes.map((r) => [r.id, r.name]));
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

  const header = [
    "Data",
    "Hora",
    "Rota",
    "Ponto na rota",
    "Vendedor",
    ...PRODUCTS.map((p) => p.name),
    "Total de pacotes",
    "Observação",
    "Enviada ao servidor",
  ];

  const rows = sales
    .slice()
    .sort((a, b) => (a.saleDate + a.createdAt < b.saleDate + b.createdAt ? -1 : 1))
    .map((s) => [
      formatShortDate(s.saleDate),
      formatTime(s.createdAt),
      routeName.get(s.routeId) ?? "",
      s.pointName,
      sellerName.get(s.sellerId) ?? "",
      ...PRODUCTS.map((p) => s.items[p.id] ?? 0),
      s.total,
      s.note,
      s.dirty ? "Não" : "Sim",
    ]);

  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const plural = (n: number) => `${n} ${n === 1 ? "pacote" : "pacotes"}`;

/** Uma linha por produto vendido: "🍧 Picolé Simples: 12". */
function productLines(list: Sale[], indent = ""): string[] {
  return PRODUCTS.map((p) => ({ p, qty: list.reduce((acc, s) => acc + (s.items[p.id] ?? 0), 0) }))
    .filter(({ qty }) => qty > 0)
    .map(({ p, qty }) => `${indent}${p.emoji} ${p.name}: ${qty}`);
}

/** Texto de fechamento do dia, pronto para colar no WhatsApp. */
export function buildDailySummary(dateStr: string, sales: Sale[], routes: Route[], defaults: Record<ProductId, number>): string {
  const day = sales.filter((s) => s.saleDate === dateStr);
  const total = day.reduce((acc, s) => acc + s.total, 0);
  const amount = day.reduce((acc, s) => acc + saleAmount(s, defaults), 0);
  const lines = [
    `🍦 *Maxbono Sorvetes — fechamento de ${formatShortDate(dateStr)}*`,
    "",
    `*Total: ${plural(total)} · ${formatMoney(amount)}*`,
    ...productLines(day),
  ];

  const byRoute = routes
    .map((r) => {
      const list = day.filter((s) => s.routeId === r.id);
      return {
        name: r.name,
        list,
        qty: list.reduce((a, s) => a + s.total, 0),
        cents: list.reduce((a, s) => a + saleAmount(s, defaults), 0),
      };
    })
    .filter((r) => r.qty > 0);
  if (byRoute.length) {
    lines.push("", "*Por rota*");
    for (const r of byRoute) {
      lines.push("", `📍 *${r.name}* — ${plural(r.qty)} · ${formatMoney(r.cents)}`, ...productLines(r.list, "   "));
    }
  }
  return lines.join("\n");
}
