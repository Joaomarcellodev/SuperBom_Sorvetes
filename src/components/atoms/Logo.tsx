import { cn } from "@/lib/format";

/** Proporção do recorte em public/brand/logo-wordmark.webp (560 × 347). */
const RATIO = 560 / 347;

const heights = { sm: 36, md: 44, lg: 112 } as const;

/** Marca oficial da Maxbono Sorvetes (recorte da arte em public/logo.png). */
export function Logo({ size = "md", className }: { size?: keyof typeof heights; className?: string }) {
  const height = heights[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagem estática pequena, também guardada pelo service worker
    <img
      src="/brand/logo-wordmark.webp"
      alt="Maxbono Sorvetes"
      width={Math.round(height * RATIO)}
      height={height}
      decoding="async"
      className={cn("shrink-0 select-none rounded-md object-contain", className)}
      style={{ height, width: "auto" }}
      draggable={false}
    />
  );
}
