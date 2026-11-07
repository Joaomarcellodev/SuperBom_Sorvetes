import { cn } from "@/lib/format";

export function PinDots({ length, total = 4, state = "idle" }: { length: number; total?: number; state?: "idle" | "error" | "success" }) {
  return (
    <div
      role="img"
      aria-label={`${length} de ${total} dígitos`}
      className={cn(
        "flex items-center justify-center gap-4 rounded-2xl bg-surface-container-lowest py-4",
        state === "error" && "animate-shake",
      )}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < length;
        return (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full transition-all duration-150",
              !filled && "bg-surface-variant",
              filled && state === "idle" && "scale-110 bg-primary-container shadow-glow-primary",
              filled && state === "error" && "bg-error",
              filled && state === "success" && "bg-secondary",
            )}
          />
        );
      })}
    </div>
  );
}
