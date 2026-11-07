"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Info, Plus, Tag, Wallet } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Banner } from "@/components/molecules/Banner";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ColumnChart } from "@/components/molecules/charts/ColumnChart";
import { RankedBars } from "@/components/molecules/charts/RankedBars";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PageHeading } from "@/components/molecules/PageHeading";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { StatTile } from "@/components/molecules/StatTile";
import { ExpenseList } from "@/components/organisms/ExpenseList";
import { ExpenseModal } from "@/components/organisms/ExpenseModal";
import { FilterBar } from "@/components/organisms/FilterBar";
import { PriceTable } from "@/components/organisms/PriceTable";
import { useExpenses, usePrices, useSales, useSellers } from "@/hooks/useData";
import { defaultFilters, matchesFilters, periodLabel, periodStart } from "@/lib/filters";
import { computeFinance, priceMap, saleAmount } from "@/lib/finance";
import { todayStr } from "@/lib/format";
import { formatMoney, formatMoneyAxis } from "@/lib/money";
import { deleteExpense } from "@/lib/repo";
import { buildBuckets } from "@/lib/series";
import type { Expense } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

const SERIES = [
  { name: "Entradas", color: "var(--color-viz-in)" },
  { name: "Saídas", color: "var(--color-viz-out)" },
];

export default function FinancePage() {
  const sales = useSales();
  const expenses = useExpenses();
  const prices = usePrices();
  const sellers = useSellers();
  const { seller } = useSession();
  const { syncNow } = useSync();
  const { toast } = useToast();

  const [filters, setFilters] = useState(() => defaultFilters("month"));
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const today = todayStr();

  const view = useMemo(() => {
    if (!sales || !expenses) return undefined;
    const defaults = priceMap(prices);
    const s = sales.filter((x) => matchesFilters({ date: x.saleDate, sellerId: x.sellerId }, filters, today));
    const e = expenses.filter((x) => matchesFilters({ date: x.expenseDate, sellerId: x.sellerId }, filters, today));
    const summary = computeFinance(s, e, defaults);

    const dates = [...s.map((x) => x.saleDate), ...e.map((x) => x.expenseDate)].sort();
    const from = periodStart(filters.period, today) || dates[0] || today;
    const points = [
      ...s.map((x) => ({ date: x.saleDate, createdAt: x.createdAt, v: [saleAmount(x, defaults), 0] })),
      ...e.map((x) => ({ date: x.expenseDate, createdAt: x.createdAt, v: [0, x.amountCents] })),
    ];
    const { buckets } = buildBuckets(points, from, today, 2, (p) => p.v);
    const pricesMissing = Object.values(defaults).every((v) => v === 0) && s.length > 0;
    return { summary, buckets, expenses: e, pricesMissing };
  }, [sales, expenses, prices, filters, today]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    await deleteExpense(id);
    toast({ title: "Gasto apagado", tone: "offline" });
    void syncNow();
  };

  if (!seller) return null;
  const s = view?.summary;

  return (
    <>
      <PageHeading
        title="Financeiro"
        description={`Entradas das vendas e gastos · ${periodLabel(filters.period).toLowerCase()}`}
        aside={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            Gasto
          </Button>
        }
      />
      <FilterBar value={filters} onChange={setFilters} sellers={sellers} />

      {!s || !view ? (
        <div className="space-y-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          {view.pricesMissing && (
            <a href="#precos" className="block">
              <Banner tone="offline" icon={<Tag />} title="Defina o preço por pacote">
                Há vendas no período, mas nenhum produto tem preço. Cadastre no fim desta tela para calcular as entradas.
              </Banner>
            </a>
          )}

          <section aria-label="Resumo" className="space-y-2">
            <StatTile
              hero
              icon={<Wallet />}
              label="Saldo do período"
              value={formatMoney(s.balanceCents)}
              caption={
                s.incomeCents === 0 && s.expenseCents === 0
                  ? "Sem entradas nem gastos no período"
                  : s.balanceCents >= 0
                    ? "Entrou mais do que saiu"
                    : "Saiu mais do que entrou"
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <StatTile icon={<ArrowDownCircle />} label="Entrou" value={formatMoney(s.incomeCents)} caption="vendas" />
              <StatTile icon={<ArrowUpCircle />} label="Gastou" value={formatMoney(s.expenseCents)} caption={`${view.expenses.length} ${view.expenses.length === 1 ? "gasto" : "gastos"}`} />
            </div>
            {s.estimatedSales > 0 && (
              <p className="flex items-start gap-2 rounded-control bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
                <Info className="mt-0.5 size-4 shrink-0 text-secondary" />
                {s.estimatedSales} {s.estimatedSales === 1 ? "venda antiga não tinha" : "vendas antigas não tinham"} preço: o valor usa o preço padrão atual.
              </p>
            )}
          </section>

          <Card className="space-y-3">
            <SectionHeader title="Entradas × saídas" />
            <ColumnChart
              buckets={view.buckets}
              series={SERIES}
              format={formatMoney}
              formatAxis={formatMoneyAxis}
              emptyText={view.pricesMissing ? "Cadastre os preços para ver as entradas." : "Sem movimento no período."}
            />
          </Card>

          <Card className="space-y-3">
            <SectionHeader title="Gastos por categoria" />
            <RankedBars
              rows={s.byCategory.map((c) => ({ id: c.id, label: c.label, value: c.cents }))}
              format={formatMoney}
              color="var(--color-viz-out)"
              emptyText="Nenhum gasto no período."
            />
          </Card>

          <section className="space-y-2" aria-label="Gastos">
            <SectionHeader
              title="Gastos"
              aside={
                <button type="button" onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1 font-bold hover:underline">
                  <Plus className="size-4" /> Registrar
                </button>
              }
            />
            <ExpenseList expenses={view.expenses} sellers={sellers ?? []} onDelete={setToDelete} />
          </section>
        </>
      )}

      <PriceTable />

      <ExpenseModal
        open={formOpen}
        seller={seller}
        sellers={sellers ?? []}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          toast({ title: "Gasto registrado", description: "Salvo no aparelho e enviado ao sócio." });
          void syncNow();
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        danger
        title="Apagar este gasto?"
        details={toDelete ? `${toDelete.description} · ${formatMoney(toDelete.amountCents)}` : null}
        description="Some do financeiro nos dois aparelhos."
        confirmLabel="Apagar"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
