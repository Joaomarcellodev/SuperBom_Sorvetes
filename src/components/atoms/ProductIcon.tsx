import { Droplets, IceCreamCone, Popsicle, type LucideIcon } from "lucide-react";
import type { ProductId } from "@/lib/types";
import { cn } from "@/lib/format";

const icons: Record<ProductId, LucideIcon> = {
  simples: Popsicle,
  cobertura: IceCreamCone,
  cremosinho: Droplets,
};

const tints: Record<ProductId, string> = {
  simples: "bg-primary-container/20 text-primary-container",
  cobertura: "bg-tertiary-container/25 text-tertiary",
  cremosinho: "bg-secondary-container/20 text-secondary",
};

export function ProductIcon({ id, size = "md" }: { id: ProductId; size?: "md" | "lg" }) {
  const Icon = icons[id];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        size === "md" ? "size-12" : "size-14",
        tints[id],
      )}
    >
      <Icon className={size === "md" ? "size-6" : "size-7"} />
    </span>
  );
}

export const productTextColor: Record<ProductId, string> = {
  simples: "text-primary",
  cobertura: "text-tertiary",
  cremosinho: "text-secondary",
};
