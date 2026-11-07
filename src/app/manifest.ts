import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Maxbono Sorvetes",
    short_name: "Maxbono",
    description: "Registro offline de pacotes de sorvete vendidos por rota.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050e3b",
    theme_color: "#050e3b",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Registrar venda", short_name: "Registrar", url: "/registrar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Histórico", url: "/historico", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Financeiro", url: "/financeiro", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
