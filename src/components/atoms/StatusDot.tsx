import { cn } from "@/lib/format";

const colors = {
  secondary: "bg-secondary",
  primary: "bg-primary-container",
  danger: "bg-error",
};

/** Bolinha de status. `pulse` faz o anel expandir (conectado / sincronizando). */
export function StatusDot({
  tone = "secondary",
  pulse,
  size = "md",
}: {
  tone?: keyof typeof colors;
  pulse?: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-2" : "size-2.5";
  return (
    <span aria-hidden className={cn("relative flex shrink-0", box)}>
      {pulse && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", colors[tone])} />}
      <span className={cn("relative inline-flex rounded-full", box, colors[tone])} />
    </span>
  );
}
