import { cn } from "@/lib/format";

export function Toggle({
  checked,
  onChange,
  label,
  tone = "secondary",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  tone?: "secondary" | "primary";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? (tone === "secondary" ? "bg-secondary" : "bg-primary-container") : "bg-surface-container-highest",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-5 rounded-full shadow-sm transition-all",
          checked ? "left-6 bg-surface-container-lowest" : "left-1 bg-on-surface-variant",
        )}
      />
    </button>
  );
}
