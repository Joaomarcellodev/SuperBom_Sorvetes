import { cn } from "@/lib/format";

/** Logos com fundo transparente geradas por scripts/generate-icons.mjs a partir de public/logo.png. */
const VARIANTS = {
  /** só "Maxbono Sorvetes": cabeçalho e lugares pequenos */
  compact: { src: "/brand/logo-compact.webp", ratio: 533 / 210 },
  /** marca completa com picolés e "Distribuidora": login, splash, destaques */
  full: { src: "/brand/logo-full.webp", ratio: 534 / 347 },
} as const;

/** Marca oficial da Maxbono Sorvetes. `height` em px; a largura acompanha a proporção. */
export function Logo({
  variant = "compact",
  height = 32,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  height?: number;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagem estática pequena, também guardada pelo service worker
    <img
      src={v.src}
      alt="Maxbono Sorvetes"
      width={Math.round(height * v.ratio)}
      height={height}
      decoding="async"
      draggable={false}
      // Altura via variável CSS: quem usa pode trocar com uma classe (ex.: em telas baixas).
      className={cn("h-[var(--logo-h)] w-auto shrink-0 select-none object-contain", className)}
      style={{ ["--logo-h" as string]: `${height}px` }}
    />
  );
}
