/**
 * PIX estático ("copia e cola" e QR Code) no padrão BR Code do Banco Central.
 * Gerado no próprio aparelho: funciona offline, sem API de banco.
 * O valor já vai preenchido; o dinheiro cai direto na chave configurada.
 */

export interface PixConfig {
  key: string;
  /** nome do recebedor (até 25 caracteres) */
  name: string;
  /** cidade do recebedor (até 15 caracteres) */
  city: string;
}

/** Chave e recebedor vêm do .env.local (veja .env.local.example). */
export function getPixConfig(): PixConfig | null {
  const key = normalizePixKey(process.env.NEXT_PUBLIC_PIX_KEY ?? "");
  if (!key) return null;
  return {
    key,
    name: process.env.NEXT_PUBLIC_PIX_NAME || "MAXBONO SORVETES",
    city: process.env.NEXT_PUBLIC_PIX_CITY || "TERESINA",
  };
}

/**
 * Celular sem +55 vira "+55DDDNUMERO" (é assim que o PIX reconhece a chave telefone).
 * E-mail, CPF/CNPJ com pontuação e chave aleatória passam como estão.
 */
export function normalizePixKey(raw: string): string {
  const key = raw.trim();
  if (!key) return "";
  if (key.startsWith("+")) return `+${key.replace(/\D/g, "")}`;
  const digits = key.replace(/\D/g, "");
  // 11 dígitos começando com DDD + 9: celular.
  if (/^\d{11}$/.test(key) && key[2] === "9") return `+55${digits}`;
  return key;
}

const field = (id: string, value: string): string => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** Remove acentos e caracteres fora do padrão (nome e cidade aceitam só ASCII simples). */
const ascii = (text: string, max: number): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim()
    .slice(0, max);

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no campo 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(payload)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({
  key,
  name,
  city,
  amountCents,
  txid = "***",
}: PixConfig & { amountCents?: number; txid?: string }): string {
  const account = field("00", "br.gov.bcb.pix") + field("01", key);
  const parts = [
    field("00", "01"),
    field("26", account),
    field("52", "0000"),
    field("53", "986"),
    amountCents && amountCents > 0 ? field("54", (amountCents / 100).toFixed(2)) : "",
    field("58", "BR"),
    field("59", ascii(name, 25)),
    field("60", ascii(city, 15)),
    field("62", field("05", txid.replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***")),
  ];
  const body = `${parts.join("")}6304`;
  return body + crc16(body);
}
