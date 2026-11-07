import { IceCreamCone } from "lucide-react";
import { cn } from "@/lib/format";

/** Marca provisória (ícone + nome). Troque por o seu logo oficial em /public quando tiver o arquivo. */
export function Logo({ size = "md", showName = true, className }: { size?: "md" | "lg"; showName?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-glow-primary",
          size === "md" ? "size-9" : "size-16 rounded-3xl",
        )}
      >
        <IceCreamCone className={size === "md" ? "size-5" : "size-9"} />
      </span>
      {showName && (
        <span className={cn("truncate font-display text-primary", size === "md" ? "text-headline-sm" : "text-headline-xl")}>
          Superbom
        </span>
      )}
    </span>
  );
}
