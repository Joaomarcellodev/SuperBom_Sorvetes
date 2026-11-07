/**
 * Gera as logos e os ícones do app a partir de public/logo.png (arte oficial da Maxbono).
 * Só precisa rodar de novo se trocar a arte:
 *   node scripts/generate-icons.mjs
 * Usa o sharp, que já vem instalado com o Next.
 *
 * Saídas:
 *  - public/brand/logo-full.webp     marca completa, fundo transparente (login, destaque do painel)
 *  - public/brand/logo-compact.webp  só "Maxbono Sorvetes", fundo transparente (cabeçalho)
 *  - public/icons/*.png              ícones do PWA, com o azul da arte de fundo
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = new URL("../public/logo.png", import.meta.url).pathname;
const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

// Recorte do nome "Maxbono Sorvetes Distribuidora" (sem slogan e selos).
const CROP = { left: 40, top: 55, width: 560, height: 347 };
const { width: W, height: H } = CROP;
// Azul do fundo da arte, para os ícones não terem emenda.
const BG = "#110f51";
mkdirSync(out("brand"), { recursive: true });

// Materializa o recorte: operações do pipeline (como removeAlpha) rodariam depois do joinChannel e apagariam a transparência.
const base = sharp(await sharp(SRC).extract(CROP).removeAlpha().png().toBuffer());

/**
 * Transparência pelo brilho: o fundo da arte é azul-escuro e as letras são claras.
 * Abaixo de 40 de luminância vira transparente, acima de 100 fica opaco.
 * `holes` apaga com borda suave pedaços soltos (bombons nos cantos).
 */
async function transparent(holes, blur) {
  const lum = await base.clone().greyscale().linear(255 / 60, (-40 * 255) / 60).blur(0.7).raw().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>${holes
    .map(([x0, y0, x1, y1, kind]) =>
      kind === "rect"
        ? `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#000"/>`
        : `<ellipse cx="${(x0 + x1) / 2}" cy="${(y0 + y1) / 2}" rx="${(x1 - x0) / 2}" ry="${(y1 - y0) / 2}" fill="#000"/>`,
    )
    .join("")}</svg>`;
  const keep = await sharp(Buffer.from(svg)).blur(blur).greyscale().raw().toBuffer();
  const alpha = Buffer.alloc(W * H);
  const step = keep.length / (W * H); // canais por pixel do SVG rasterizado
  for (let i = 0; i < W * H; i++) alpha[i] = Math.round((lum[i] * keep[i * step]) / 255);
  return base.clone().joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } });
}

const BONBON = [-60, 10, 150, 150];
const full = await transparent([BONBON, [330, 318, 520, 400], [430, 290, 700, 460]], 6);
await sharp(await full.png().toBuffer()).trim({ threshold: 1 }).webp({ quality: 88, alphaQuality: 90 }).toFile(out("brand/logo-full.webp"));

const compact = await transparent([BONBON, [340, -10, 600, 104, "rect"], [0, 284, W, H, "rect"], [480, 262, W, H, "rect"]], 4);
await sharp(await sharp(await compact.png().toBuffer()).extract({ left: 15, top: 80, width: 540, height: 210 }).png().toBuffer())
  .trim({ threshold: 1 })
  .webp({ quality: 90, alphaQuality: 90 })
  .toFile(out("brand/logo-compact.webp"));

async function icon(size, scale, file) {
  const width = Math.round(size * scale);
  const art = await base.clone().resize({ width }).png().toBuffer();
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
console.log("Logos em public/brand e ícones em public/icons gerados.");
