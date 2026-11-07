/* Superbom Sorvetes — service worker (offline-first)
 *
 * Objetivo: depois da primeira visita online, o app abre e funciona sem internet.
 *  - Páginas: rede primeiro (pega a versão nova), cache como reserva.
 *  - /_next/static e /icons: cache primeiro (arquivos têm hash no nome, nunca mudam).
 *  - Instalação e cada abertura do app: baixam as 5 telas e TODOS os arquivos que elas
 *    citam, para que qualquer tela abra offline mesmo que você nunca tenha entrado nela.
 *
 * Os dados (vendas, rotas) NÃO passam por aqui: ficam no IndexedDB e sincronizam com o Supabase.
 * Mudou a lógica do cache? Aumente VERSION.
 */
const VERSION = "v1";
const STATIC_CACHE = `superbom-static-${VERSION}`;
const PAGE_CACHE = `superbom-pages-${VERSION}`;
const RSC_CACHE = `superbom-rsc-${VERSION}`;
const KEEP = [STATIC_CACHE, PAGE_CACHE, RSC_CACHE];

const PAGES = ["/", "/login", "/registrar", "/historico", "/ajustes"];
const EXTRA = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];
const NAV_TIMEOUT_MS = 4000;

/* ---------- pré-cache ---------- */

function assetsFromHtml(html) {
  const found = new Set();
  // 1) links diretos: <script src="/_next/static/...">, <link href="/_next/static/...">
  for (const m of html.matchAll(/\/_next\/static\/[^"'\s\\)<>]+/g)) found.add(m[0]);
  // 2) referências dentro do payload do React Server Components: "static/chunks/xxx.js"
  for (const m of html.matchAll(/(?<![\/\w])static\/(?:chunks|css|media)\/[^"'\s\\)<>]+/g)) found.add(`/_next/${m[0]}`);
  return found;
}

function fontsFromCss(css, cssUrl) {
  const found = new Set();
  for (const m of css.matchAll(/url\(\s*["']?([^)"']+?\.(?:woff2|woff))["']?\s*\)/g)) {
    try {
      found.add(new URL(m[1], new URL(cssUrl, self.location.origin)).pathname);
    } catch {
      /* url inválida: ignora */
    }
  }
  return found;
}

async function precache() {
  const pages = await caches.open(PAGE_CACHE);
  const statics = await caches.open(STATIC_CACHE);
  const assets = new Set(EXTRA);

  await Promise.all(
    PAGES.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (!res.ok) return;
        await pages.put(url, res.clone());
        for (const a of assetsFromHtml(await res.text())) assets.add(a);
      } catch {
        /* sem rede agora: tenta de novo na próxima abertura */
      }
    }),
  );

  const queue = [...assets];
  const seen = new Set(queue);
  while (queue.length) {
    const url = queue.shift();
    try {
      if (await statics.match(url)) continue; // arquivos com hash: se já tem, não baixa de novo
      const res = await fetch(url);
      if (!res.ok) continue;
      await statics.put(url, res.clone());
      if (url.endsWith(".css")) {
        for (const font of fontsFromCss(await res.text(), url)) {
          if (!seen.has(font)) {
            seen.add(font);
            queue.push(font);
          }
        }
      }
    } catch {
      /* ignora: o cache em tempo de uso cobre */
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("superbom-") && !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

// O app avisa a cada abertura online: atualiza as telas e baixa arquivos novos de um deploy novo.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "REFRESH") event.waitUntil(precache());
});

/* ---------- estratégias ---------- */

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const path = new URL(request.url).pathname.replace(/(.)\/$/, "$1");
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS);
    if (res.ok) cache.put(path, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(path, { ignoreVary: true })) ||
      (await cache.match("/", { ignoreVary: true })) ||
      new Response("Sem internet e esta tela ainda não foi salva no aparelho.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function networkFirstData(request) {
  const cache = await caches.open(RSC_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreVary: true });
    // Sem cópia: erro de rede. O Next recarrega a página inteira, e aí a navegação cai no cache de páginas.
    return hit || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  } else if (request.headers.get("RSC") || url.searchParams.has("_rsc") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(networkFirstData(request));
  }
});
