import { cn } from "@/lib/format";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8 text-label-md", md: "size-12 text-headline-sm", lg: "size-14 text-headline-md" };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-on-primary-container shadow-glow-primary",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
