import { Avatar } from "../atoms/Avatar";
import { StatusDot } from "../atoms/StatusDot";
import { formatRelative } from "@/lib/format";
import { describeItems } from "@/lib/products";
import type { Sale, Seller } from "@/lib/types";

/** Linha compacta de venda (lista "Últimas vendas" do painel). */
export function SaleRow({ sale, routeName, seller, amount }: { sale: Sale; routeName: string; seller?: Seller; amount: string }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar name={seller?.name ?? "?"} photo={seller?.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-lg text-on-surface">{sale.pointName || routeName}</p>
        <p className="truncate text-body-sm text-on-surface-variant">{describeItems(sale.items)}</p>
        <p className="flex items-center gap-1 truncate text-label-sm text-outline">
          {sale.dirty === 1 && <StatusDot tone="primary" size="sm" />}
          {sale.dirty === 1 ? "Pendente de envio" : formatRelative(sale.createdAt)}
          {sale.pointName ? ` · ${routeName}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="tabular text-label-lg text-on-surface">
          {sale.total} <span className="text-label-sm font-medium text-on-surface-variant">pct</span>
        </span>
        {amount && <span className="tabular text-label-sm text-on-surface-variant">{amount}</span>}
      </div>
    </li>
  );
}
