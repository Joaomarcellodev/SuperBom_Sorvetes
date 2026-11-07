import { cn } from "@/lib/format";

export function PinDots({ length, total = 4, state = "idle" }: { length: number; total?: number; state?: "idle" | "error" | "success" }) {
  return (
    <div
      role="img"
      aria-label={`${length} de ${total} dígitos`}
      className={cn("flex items-center justify-center gap-5 py-2", state === "error" && "animate-shake")}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < length;
        return (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full ring-2 transition-all duration-150",
              !filled && "bg-transparent ring-on-surface-variant/50",
              filled && state === "idle" && "scale-110 bg-primary-container ring-primary-container shadow-glow-primary",
              filled && state === "error" && "bg-error ring-error",
              filled && state === "success" && "bg-secondary ring-secondary",
            )}
          />
        );
      })}
    </div>
  );
}
