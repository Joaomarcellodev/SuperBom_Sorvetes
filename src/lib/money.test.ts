import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyInput, parseMoneyDigits } from "./money";

describe("money", () => {
  it("formata centavos como real", () => {
    expect(formatMoney(123456)).toBe("R$ 1.234,56");
    expect(formatMoney(0)).toBe("R$ 0,00");
  });
  it("máscara de centavos: só dígitos, últimos dois são centavos", () => {
    expect(parseMoneyDigits("1250")).toBe(1250);
    expect(parseMoneyDigits("R$ 12,50")).toBe(1250);
    expect(parseMoneyDigits("")).toBe(0);
    expect(parseMoneyDigits("abc")).toBe(0);
    expect(formatMoneyInput(1250)).toBe("12,50");
    expect(formatMoneyInput(5)).toBe("0,05");
  });
  it("limita o tamanho para não estourar", () => {
    expect(parseMoneyDigits("12345678901234")).toBe(123456789);
  });
});
