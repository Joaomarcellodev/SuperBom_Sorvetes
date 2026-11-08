import { describe, expect, it } from "vitest";
import { receiptLines, receiptNumber, receiptPayment } from "./receipt";
import type { Sale } from "./types";

const base: Sale = {
  id: "3f2a9c1e-0b7d-4e55-9a10-1234567890ab",
  routeId: "r1",
  pointName: "Mercadinho São José",
  sellerId: "joao",
  saleDate: "2026-11-07",
  note: "",
  items: { simples: 10, cremosinho: 4 },
  total: 14,
  unitPrices: { simples: 300, cremosinho: 250 },
  amountCents: 4000,
  createdAt: "2026-11-07T14:30:00",
  deletedAt: null,
  dirty: 0,
};
const defaults = { simples: 250, cobertura: 400, cremosinho: 200 };

describe("recibo", () => {
  it("número curto vem do id da venda", () => {
    expect(receiptNumber(base)).toBe("3F2A9C1E");
  });
  it("usa o preço da venda, não o padrão", () => {
    expect(receiptLines(base, defaults)).toEqual([
      { name: "Picolé Simples", qty: 10, unit: 300, subtotal: 3000 },
      { name: "Cremosinho", qty: 4, unit: 250, subtotal: 1000 },
    ]);
  });
  it("venda antiga, sem preço próprio, usa o preço padrão", () => {
    const old = { ...base, unitPrices: undefined, amountCents: undefined };
    expect(receiptLines(old, defaults)[0]).toMatchObject({ unit: 250, subtotal: 2500 });
  });
  it("mostra a situação do pagamento", () => {
    expect(receiptPayment({ ...base, paymentStatus: "pago", paymentMethod: "pix" })).toBe("Pago (PIX)");
    expect(receiptPayment({ ...base, paymentStatus: "pendente", paymentMethod: null })).toBe("A receber (pendente)");
    expect(receiptPayment({ ...base, paymentStatus: "pago", paymentMethod: "dinheiro", paidAt: "2026-11-14T10:00:00Z" })).toBe(
      "Pago em 14/11/2026 (Dinheiro)",
    );
    expect(receiptPayment(base)).toBe("Pago");
  });
});
