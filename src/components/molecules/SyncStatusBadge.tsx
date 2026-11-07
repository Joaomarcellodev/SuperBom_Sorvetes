import { StatusDot } from "../atoms/StatusDot";
import { cn } from "@/lib/format";

/** "Online" (ciano pulsando) / "Offline" (âmbar parado). */
export function SyncStatusBadge({ online, syncing, className }: { online: boolean; syncing?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-label-sm", online ? "text-secondary" : "text-primary", className)}>
      <StatusDot tone={online ? "secondary" : "primary"} pulse={online} size="sm" />
      {online ? (syncing ? "Sincronizando" : "Online") : "Offline"}
    </span>
  );
}
