import { Check } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { cn } from "@/lib/format";
import type { Seller } from "@/lib/types";

/** Cartão grande de 1 toque para escolher quem está usando o app. */
export function ProfileCard({ seller, selected, onSelect }: { seller: Seller; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-start gap-2 overflow-hidden rounded-card p-4 text-left transition-all duration-150 active:scale-[0.98]",
        selected ? "bg-surface-container-high shadow-card" : "bg-surface-container-low opacity-70",
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-6 items-center justify-center rounded-control bg-primary-container text-on-primary-container shadow-glow-primary transition-opacity",
          selected ? "opacity-100" : "opacity-0",
        )}
      >
        <Check className="size-4" />
      </span>
      <Avatar name={seller.name} photo={seller.avatarUrl} />
      <span className="min-w-0 max-w-full">
        <span className={cn("block truncate font-display text-headline-sm", selected ? "text-primary" : "text-on-surface")}>{seller.name}</span>
        <span className="mt-0.5 block truncate text-label-sm text-on-surface-variant">{seller.role}</span>
      </span>
    </button>
  );
}
