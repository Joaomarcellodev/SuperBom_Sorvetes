import { Check } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { cn } from "@/lib/format";
import type { Seller } from "@/lib/types";

/** Perfil de 1 toque na tela de login: foto grande, nome e cargo. */
export function ProfileCard({ seller, selected, onSelect }: { seller: Seller; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex w-36 flex-col items-center gap-2 rounded-card p-2 text-center outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-secondary",
        selected ? "opacity-100" : "opacity-55 hover:opacity-80",
      )}
    >
      <span className="relative">
        <Avatar
          name={seller.name}
          photo={seller.avatarUrl}
          size="xl"
          className={cn("size-20 text-headline-lg transition-all", selected ? "ring-[3px] ring-primary-container ring-offset-4 ring-offset-surface" : "ring-0")}
        />
        {selected && (
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary-container text-on-primary-container ring-4 ring-surface">
            <Check className="size-4" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="w-full min-w-0">
        <span className={cn("block truncate font-display text-headline-sm", selected ? "text-on-surface" : "text-on-surface-variant")}>
          {seller.name.split(" ")[0]}
        </span>
        <span className="line-clamp-2 block text-label-sm text-on-surface-variant">{seller.role}</span>
      </span>
    </button>
  );
}
