import { StatusDot } from "../atoms/StatusDot";
import { cn } from "@/lib/format";

/** "Online" (ciano pulsando) / "Offline" (âmbar parado). `compact`: em tela estreita mostra só a bolinha. */
export function SyncStatusBadge({
  online,
  syncing,
  compact,
  className,
}: {
  online: boolean;
  syncing?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const text = online ? (syncing ? "Sincronizando" : "Online") : "Offline";
  return (
    <span
      title={text}
      className={cn("inline-flex items-center gap-1 text-label-sm", online ? "text-secondary" : "text-primary", className)}
    >
      <StatusDot tone={online ? "secondary" : "primary"} pulse={online} size="sm" />
      <span className={compact ? "sr-only min-[400px]:not-sr-only" : undefined}>{text}</span>
    </span>
  );
}
