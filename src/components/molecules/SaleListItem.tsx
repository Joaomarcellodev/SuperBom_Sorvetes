import type { ReactNode } from "react";
import { Clock, Trash2, UserRound } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Card } from "../atoms/Card";
import { IconButton } from "../atoms/IconButton";
import { StatusDot } from "../atoms/StatusDot";
import { isOpenDebt, paymentMethodLabel } from "@/lib/payment";
import { describeItems } from "@/lib/products";
import { formatRelative, formatTime } from "@/lib/format";
import type { Sale } from "@/lib/types";

export function SaleListItem({
  sale,
  routeName,
  sellerName,
  isMine,
  timeStyle = "relative",
  amount,
  actions,
  onDelete,
}: {
  sale: Sale;
  /** valor da venda já formatado ("R$ 45,00") */
  amount?: string;
  /** botões extras (recibo, receber pendência) */
  actions?: ReactNode;
  routeName: string;
  sellerName: string;
  isMine?: boolean;
  /** "relative" = "Há 25 min" (início); "clock" = "14:30" (histórico, já agrupado por dia) */
  timeStyle?: "relative" | "clock";
  onDelete?: () => void;
}) {
  const pending = sale.dirty === 1;
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-headline-sm">{sale.pointName || routeName}</p>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{sale.total} {sale.total === 1 ? "pacote" : "pacotes"}</span>{" "}
            <span className="text-secondary">({describeItems(sale.items)})</span>
          </p>
          {amount && <p className="tabular mt-0.5 text-label-lg text-on-surface">{amount}</p>}
          {sale.pointName && <p className="mt-0.5 truncate text-body-sm text-outline">{routeName}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {pending ? (
            <Badge tone="primary">
              <StatusDot tone="primary" pulse size="sm" /> Pendente
            </Badge>
          ) : (
            <Badge tone="secondary">
              <StatusDot tone="secondary" size="sm" /> Sincronizado
            </Badge>
          )}
          {onDelete && (
            <IconButton label="Apagar venda" tone="danger" className="size-10" onClick={onDelete}>
              <Trash2 className="size-[18px]" />
            </IconButton>
          )}
        </div>
      </div>
      {(sale.paymentStatus || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {isOpenDebt(sale) ? (
            <Badge tone="danger">A receber</Badge>
          ) : sale.paymentMethod ? (
            <Badge tone="neutral">
              {paymentMethodLabel(sale.paymentMethod)}
              {sale.paidAt ? " · pendência paga" : ""}
            </Badge>
          ) : (
            <span />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {sale.note && <p className="mt-1 rounded-control bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface-variant">{sale.note}</p>}
      <div className="flex items-center justify-between pt-2 text-label-sm text-on-surface-variant">
        <span className="flex min-w-0 items-center gap-1">
          <UserRound className="size-3.5 shrink-0" />
          <span className="truncate">
            Vendedor: <span className={isMine ? "font-bold text-primary" : "font-semibold text-on-surface"}>{sellerName}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Clock className="size-3.5" />
          {timeStyle === "relative" ? formatRelative(sale.createdAt) : formatTime(sale.createdAt)}
        </span>
      </div>
    </Card>
  );
}
