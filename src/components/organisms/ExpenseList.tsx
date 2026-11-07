"use client";

import { ReceiptText, Trash2, UserRound } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Card } from "../atoms/Card";
import { IconButton } from "../atoms/IconButton";
import { StatusDot } from "../atoms/StatusDot";
import { EmptyState } from "../molecules/EmptyState";
import { formatDayLabel } from "@/lib/format";
import { categoryLabel, sumExpenses } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import type { Expense, Seller } from "@/lib/types";

export function ExpenseList({
  expenses,
  sellers,
  onDelete,
}: {
  expenses: Expense[];
  sellers: Seller[];
  onDelete: (expense: Expense) => void;
}) {
  if (expenses.length === 0) {
    return <EmptyState icon={<ReceiptText />} title="Nenhum gasto no período" description="Registre combustível, reposição e outros custos para ver o saldo real." />;
  }

  const days = new Map<string, Expense[]>();
  for (const e of expenses) days.set(e.expenseDate, [...(days.get(e.expenseDate) ?? []), e]);
  const sellerName = (id: string) => sellers.find((s) => s.id === id)?.name.split(" ")[0] ?? "—";

  return (
    <div className="space-y-4">
      {[...days.entries()].map(([date, list]) => (
        <section key={date} className="space-y-2" aria-label={formatDayLabel(date)}>
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-label-lg text-on-surface">{formatDayLabel(date)}</h3>
            <span className="tabular text-label-md text-on-surface-variant">{formatMoney(sumExpenses(list))}</span>
          </div>
          {list.map((e) => (
            <Card key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg text-on-surface">{e.description}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-on-surface-variant">
                  <Badge tone="neutral">{categoryLabel(e.category)}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5" /> {sellerName(e.sellerId)}
                  </span>
                  {e.dirty === 1 && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <StatusDot tone="primary" size="sm" /> Pendente
                    </span>
                  )}
                </p>
                {e.note && <p className="mt-1 truncate text-body-sm text-outline">{e.note}</p>}
              </div>
              <span className="tabular shrink-0 font-display text-headline-sm text-on-surface">− {formatMoney(e.amountCents)}</span>
              <IconButton label="Apagar gasto" tone="danger" className="size-10" onClick={() => onDelete(e)}>
                <Trash2 className="size-[18px]" />
              </IconButton>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
