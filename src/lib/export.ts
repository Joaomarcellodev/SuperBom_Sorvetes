import { formatShortDate, formatTime } from "./format";
import { PRODUCTS } from "./products";
import type { Route, Sale, Seller } from "./types";

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

/** Texto de fechamento do dia, pronto para colar no WhatsApp. */
export function buildDailySummary(dateStr: string, sales: Sale[], routes: Route[]): string {
  const day = sales.filter((s) => s.saleDate === dateStr);
  const total = day.reduce((acc, s) => acc + s.total, 0);
  const lines = [`🍦 *Maxbono Sorvetes — fechamento de ${formatShortDate(dateStr)}*`, "", `*Total: ${total} pacotes*`];

  for (const p of PRODUCTS) {
    const qty = day.reduce((acc, s) => acc + (s.items[p.id] ?? 0), 0);
    lines.push(`• ${p.name}: ${qty}`);
  }

  const byRoute = routes
    .map((r) => ({ name: r.name, qty: day.filter((s) => s.routeId === r.id).reduce((a, s) => a + s.total, 0) }))
    .filter((r) => r.qty > 0);
  if (byRoute.length) {
    lines.push("", "*Por rota*");
    for (const r of byRoute) lines.push(`• ${r.name}: ${r.qty}`);
  }
  return lines.join("\n");
}
