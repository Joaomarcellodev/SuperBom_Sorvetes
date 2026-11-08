import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, normalizePixKey } from "./pix";

describe("PIX", () => {
  it("gera o exemplo oficial do manual do BR Code", () => {
    const payload = buildPixPayload({ key: "123e4567-e12b-12d1-a456-426655440000", name: "Fulano de Tal", city: "BRASILIA" });
    expect(payload).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui o valor e confere o CRC", () => {
    const payload = buildPixPayload({ key: "+5586995120533", name: "Maxbono Sorvetes", city: "Teresina", amountCents: 4550 });
    expect(payload).toContain("0114+5586995120533");
    expect(payload).toContain("540545.50");
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  it("tira acentos e corta nome e cidade no tamanho do padrão", () => {
    const payload = buildPixPayload({ key: "a@b.com", name: "Sorveteria São João do Piauí Ltda", city: "São Raimundo Nonato" });
    expect(payload).toContain("5925Sorveteria Sao Joao do P");
    expect(payload).toContain("6015Sao Raimundo No");
  });

  it("celular sem +55 vira chave telefone", () => {
    expect(normalizePixKey("86995120533")).toBe("+5586995120533");
    expect(normalizePixKey("+55 (86) 99512-0533")).toBe("+5586995120533");
    expect(normalizePixKey("contato@maxbono.com")).toBe("contato@maxbono.com");
    expect(normalizePixKey("123.456.789-09")).toBe("123.456.789-09");
  });
});
