import { cn } from "@/lib/format";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const sizes = {
  sm: "size-8 text-label-md",
  md: "size-12 text-headline-sm",
  lg: "size-16 text-headline-md",
  xl: "size-24 text-headline-xl",
};

/** Foto do perfil; sem foto, mostra as iniciais. */
export function Avatar({
  name,
  photo,
  size = "md",
  className,
}: {
  name: string;
  photo?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const base = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full", sizes[size], className);
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL local, o otimizador do Next não se aplica
    return <img src={photo} alt="" aria-hidden className={cn(base, "object-cover ring-2 ring-primary-container/70")} />;
  }
  return (
    <span aria-hidden className={cn(base, "bg-primary-container font-display text-on-primary-container")}>
      {initials(name)}
    </span>
  );
}
