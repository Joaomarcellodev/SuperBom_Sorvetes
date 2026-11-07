/**
 * Gera a marca e os ícones do app a partir de public/logo.png (arte oficial da Maxbono).
 * Só precisa rodar de novo se trocar a arte:
 *   node scripts/generate-icons.mjs
 * Usa o sharp, que já vem instalado com o Next.
 */
import sharp from "sharp";

const SRC = new URL("../public/logo.png", import.meta.url).pathname;
const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

// Recorte só do nome "Maxbono Sorvetes Distribuidora" (sem slogan e selos).
const CROP = { left: 40, top: 55, width: 560, height: 347 };
// Azul do fundo da arte, para os ícones não terem emenda.
const BG = "#110f51";

const mark = sharp(SRC).extract(CROP);
await mark.clone().webp({ quality: 86 }).toFile(out("brand/logo-wordmark.webp"));

async function icon(size, scale, file) {
  const width = Math.round(size * scale);
  const art = await mark.clone().resize({ width }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(out(`icons/${file}`));
}

// "maskable": desenho menor para caber na zona segura (80%) que o Android recorta.
await icon(512, 0.94, "icon-512.png");
await icon(192, 0.94, "icon-192.png");
await icon(512, 0.78, "maskable-512.png");
await icon(180, 0.94, "apple-touch-icon.png");
console.log("Ícones gerados em public/icons e public/brand.");
