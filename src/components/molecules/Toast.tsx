import { CircleAlert, CircleCheck, CloudUpload, X } from "lucide-react";
import { cn } from "@/lib/format";
import { IconButton } from "../atoms/IconButton";

export type ToastTone = "success" | "offline" | "error";

const icons = { success: CircleCheck, offline: CloudUpload, error: CircleAlert };
const circle = {
  success: "bg-secondary text-on-secondary shadow-glow-secondary",
  offline: "bg-primary-container text-on-primary-container shadow-glow-primary",
  error: "bg-error text-on-error",
};
const titleColor = { success: "text-secondary", offline: "text-primary", error: "text-error" };

export function Toast({
  title,
  description,
  tone = "success",
  onClose,
}: {
  title: string;
  description?: string;
  tone?: ToastTone;
  onClose?: () => void;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex animate-toast-in items-center gap-3 rounded-control bg-surface-container-high p-3 shadow-card ring-1 ring-white/10"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-control", circle[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-label-lg", titleColor[tone])}>{title}</p>
        {description && <p className="text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {onClose && (
        <IconButton label="Fechar aviso" onClick={onClose} className="size-9 bg-transparent">
          <X className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
