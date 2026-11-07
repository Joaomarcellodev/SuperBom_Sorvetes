/**
 * Gera os PNGs do app a partir de public/icons/icon.svg.
 * Só precisa rodar de novo se mudar o desenho. Requer o Playwright instalado:
 *   npm i -D playwright && npx playwright install chromium && node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
// "maskable": fundo sem cantos arredondados e desenho menor (zona segura de 80%).
const maskable = svg
  .replace(/<rect width="512" height="512" rx="112"/, '<rect width="512" height="512" rx="0"')
  .replace("<g transform=\"rotate(-20 256 256)\">", '<g transform="translate(256 256) scale(0.8) translate(-256 -256) rotate(-20 256 256)">');
// apple-touch-icon: iOS aplica os cantos sozinho.
const apple = svg.replace(/<rect width="512" height="512" rx="112"/, '<rect width="512" height="512" rx="0"');

const jobs = [
  ["icon-192.png", svg, 192],
  ["icon-512.png", svg, 512],
  ["maskable-512.png", maskable, 512],
  ["apple-touch-icon.png", apple, 180],
];

const browser = await chromium.launch();
for (const [name, markup, size] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`,
  );
  const png = await page.screenshot({ omitBackground: true, type: "png" });
  writeFileSync(new URL(`../public/icons/${name}`, import.meta.url), png);
  await page.close();
  console.log("gerado", name);
}
await browser.close();
