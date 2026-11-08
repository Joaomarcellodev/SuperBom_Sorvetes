"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, HandCoins, NotebookPen, Pencil, QrCode, Tag, TriangleAlert, UserRound, Users, WifiOff, X } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";
import { MoneyInput } from "../atoms/MoneyInput";
import { Banner } from "../molecules/Banner";
import { Disclosure } from "../molecules/Disclosure";
import { Field } from "../molecules/Field";
import { ProductCard } from "../molecules/ProductCard";
import { SectionHeader } from "../molecules/SectionHeader";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { IconButton } from "../atoms/IconButton";
import { SellerToggle, type SellerOption } from "../molecules/SellerToggle";
import { PendingPayments } from "./PendingPayments";
import { PixModal } from "./PixModal";
import { ReceiptButton } from "./ReceiptButton";
import { RouteFormModal } from "./RouteFormModal";
import { RouteSelector } from "./RouteSelector";
import { useActiveRoutes, usePrices } from "@/hooks/useData";
import { amountFor, priceMap } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { formatShortDate, todayStr } from "@/lib/format";
import { PRODUCTS, emptyItems, sumItems } from "@/lib/products";
import type { PaymentMethod, ProductId, Sale, UnitPrices } from "@/lib/types";
import { saveSale } from "@/lib/repo";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

const LAST_ROUTE_KEY = "superbom.lastRoute";

type PaymentChoice = PaymentMethod | "depois";
const PAYMENT_OPTIONS: ReadonlyArray<{ id: PaymentChoice; label: string }> = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
  { id: "depois", label: "Pagar depois" },
];
const firstName = (full: string) => full.split(" ")[0] ?? full;

function readLastRoute(): string | null {
  try {
    return localStorage.getItem(LAST_ROUTE_KEY);
  } catch {
    return null;
  }
}

export function SaleForm() {
  const { seller, sellers } = useSession();
  const routes = useActiveRoutes();
  const prices = usePrices();
  const { online, configured, syncNow } = useSync();
  const { toast } = useToast();

  const [routeChoice, setRouteChoice] = useState<string | null>(null);
  const [pointName, setPointName] = useState("");
  const [sellerChoice, setSellerChoice] = useState<string | null>(null);
  const [saleDate, setSaleDate] = useState(todayStr);
  const [editingDate, setEditingDate] = useState(false);
  const [qty, setQty] = useState(emptyItems);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRouteOpen, setNewRouteOpen] = useState(false);
  const [editRouteOpen, setEditRouteOpen] = useState(false);
  /** preço ajustado só nesta venda (por produto); sem ajuste = preço padrão */
  const [priceOverride, setPriceOverride] = useState<UnitPrices>({});
  const [payment, setPayment] = useState<PaymentChoice>("dinheiro");
  const [pixOpen, setPixOpen] = useState(false);
  /** última venda salva nesta tela: dá acesso rápido ao recibo */
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const routeList = routes ?? [];
  // Rota escolhida > última rota usada neste aparelho > primeira da lista.
  const routeId =
    routeList.find((r) => r.id === routeChoice)?.id ??
    routeList.find((r) => r.id === readLastRoute())?.id ??
    routeList[0]?.id ??
    "";

  const sellerOptions = useMemo<SellerOption[]>(() => {
    if (!seller) return [];
    const others = sellers.filter((s) => s.id !== seller.id);
    return [
      { id: seller.id, label: `Eu (${firstName(seller.name)})`, icon: <UserRound /> },
      ...others.map((s) => ({
        id: s.id,
        label: firstName(s.name),
        icon: <Users />,
      })),
    ];
  }, [seller, sellers]);

  if (!seller) return null;

  const sellerId = sellerChoice ?? seller.id;
  const total = sumItems(qty);
  const defaults = priceMap(prices);
  const unitPrices = Object.fromEntries(PRODUCTS.map((p) => [p.id, priceOverride[p.id] ?? defaults[p.id]])) as Record<ProductId, number>;
  const amount = amountFor(qty, unitPrices);
  const pricesMissing = PRODUCTS.every((p) => defaults[p.id] === 0);
  const adjusted = PRODUCTS.some((p) => priceOverride[p.id] !== undefined && priceOverride[p.id] !== defaults[p.id]);
  const soldProducts = PRODUCTS.filter((p) => qty[p.id] > 0);
  const isToday = saleDate === todayStr();

  const chooseRoute = (id: string) => {
    setRouteChoice(id);
    setPointName("");
    try {
      localStorage.setItem(LAST_ROUTE_KEY, id);
    } catch {
      /* sem storage: só não lembra a rota */
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!routeId) return setError("Escolha ou crie uma rota antes de salvar.");
    if (total <= 0) return setError("Informe ao menos 1 pacote.");
    if (payment === "depois" && !pointName.trim()) {
      return setError("Para pagar depois, informe o cliente/ponto: é por ele que a pendência é cobrada.");
    }

    setSaving(true);
    try {
      const saved = await saveSale({
        routeId,
        pointName,
        sellerId,
        saleDate,
        note,
        items: qty,
        unitPrices,
        paymentMethod: payment === "depois" ? null : payment,
      });
      setLastSale(saved);
      if (payment === "depois") {
        toast({ title: "Pendência registrada", description: "Aparece nesta rota até o cliente pagar.", tone: "offline" });
      } else if (online && configured) {
        toast({ title: "Venda salva!", description: "Enviando para o servidor.", tone: "success" });
      } else {
        toast({
          title: "Salvo no aparelho!",
          description: "Funciona normalmente sem internet. O envio é automático ao reconectar.",
          tone: "offline",
        });
      }
      setQty(emptyItems());
      setPriceOverride({});
      setPayment("dinheiro");
      setPointName("");
      setNote("");
      void syncNow();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a venda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      {!online && (
        <Banner tone="offline" icon={<WifiOff />} title="Offline ativo">
          Sua venda será guardada aqui e enviada ao reconectar.
        </Banner>
      )}

      {lastSale && (
        <Card tone="raised" className="flex items-center gap-3">
          <CircleCheck className="size-6 shrink-0 text-secondary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg text-on-surface">Última venda: {lastSale.pointName || "sem cliente"}</p>
            <p className="tabular text-body-sm text-on-surface-variant">
              {lastSale.total} {lastSale.total === 1 ? "pacote" : "pacotes"} · {formatMoney(lastSale.amountCents ?? 0)}
              {lastSale.paymentStatus === "pendente" ? " · a receber" : ""}
            </p>
          </div>
          <ReceiptButton
            sale={lastSale}
            info={{
              routeName: routeList.find((r) => r.id === lastSale.routeId)?.name ?? "",
              sellerName: sellers.find((s) => s.id === lastSale.sellerId)?.name ?? "",
              defaults,
            }}
          />
          <IconButton label="Fechar" className="size-9 bg-transparent" onClick={() => setLastSale(null)}>
            <X className="size-4" />
          </IconButton>
        </Card>
      )}

      <RouteSelector
        routes={routeList}
        routeId={routeId}
        onRouteChange={chooseRoute}
        pointName={pointName}
        onPointChange={setPointName}
        onNewRoute={() => setNewRouteOpen(true)}
        onEditRoute={() => setEditRouteOpen(true)}
      />

      {routeId && <PendingPayments routeId={routeId} />}

      <Card className="space-y-4">
        <div className="space-y-2">
          <Label>Quem vendeu?</Label>
          <SellerToggle options={sellerOptions} value={sellerId} onChange={setSellerChoice} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <Label htmlFor="sale-date">Data do registro</Label>
            {editingDate ? (
              <input
                id="sale-date"
                type="date"
                value={saleDate}
                max={todayStr()}
                onChange={(e) => e.target.value && setSaleDate(e.target.value)}
                className="mt-1 h-10 rounded-control bg-surface-container-lowest px-3 text-[16px] text-on-surface outline-none [color-scheme:dark] focus:ring-2 focus:ring-secondary"
              />
            ) : (
              <p className="mt-1 text-label-lg text-on-surface">
                {isToday ? `Hoje, ${formatShortDate(saleDate)}` : formatShortDate(saleDate)}
              </p>
            )}
          </div>
          <Button
            variant="soft"
            size="sm"
            icon={<Pencil className="size-4" />}
            onClick={() => setEditingDate((v) => !v)}
          >
            {editingDate ? "Pronto" : "Alterar"}
          </Button>
        </div>
      </Card>

      <section className="space-y-4" aria-label="Pacotes por produto">
        <SectionHeader title="Quantos pacotes?" aside={<Badge tone="neutral">{PRODUCTS.length} produtos</Badge>} />
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            qty={qty[product.id]}
            onChange={(next) => setQty((q) => ({ ...q, [product.id]: next }))}
          />
        ))}
      </section>

      <Card tone="raised" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-md uppercase text-on-surface-variant">Resumo da venda</span>
          {!isToday && <Badge tone="primary">Data alterada</Badge>}
        </div>
        <div className="flex items-end justify-between gap-3 rounded-control bg-surface-container-lowest p-3">
          <div>
            <span className="text-label-sm text-on-surface-variant">VOLUME TOTAL</span>
            <p className="tabular font-display text-metric-lg leading-none text-primary-container">
              {total}
              <span className="ml-1 text-label-sm font-bold text-primary">{total === 1 ? "pacote" : "pacotes"}</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => (
              <Badge key={p.id} tone="neutral">{qty[p.id]} {p.short}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-label-md uppercase text-on-surface-variant">Valor da venda</span>
          <span className="flex items-center gap-2">
            {adjusted && <Badge tone="secondary">Preço ajustado</Badge>}
            <span className="font-display text-headline-md text-on-surface">{formatMoney(amount)}</span>
          </span>
        </div>
        {pricesMissing && (
          <p className="rounded-control bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface-variant">
            Nenhum preço cadastrado ainda.{" "}
            <Link href="/financeiro#precos" className="font-bold text-secondary hover:underline">Definir preços no Financeiro</Link>
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <Label>Pagamento</Label>
        <SegmentedControl label="Forma de pagamento" options={PAYMENT_OPTIONS} value={payment} onChange={setPayment} />
        {payment === "pix" && (
          <Button variant="outline" fullWidth icon={<QrCode className="size-5" />} onClick={() => setPixOpen(true)}>
            Mostrar QR Code do PIX ({formatMoney(amount)})
          </Button>
        )}
        {payment === "depois" && (
          <p className="flex items-start gap-2 rounded-control bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface-variant">
            <HandCoins className="mt-0.5 size-4 shrink-0 text-primary" />
            Fica nas pendências desta rota até o cliente pagar na próxima passada.
          </p>
        )}
      </Card>

      {soldProducts.length > 0 && (
        <Disclosure icon={<Tag />} title="Preço por pacote nesta venda">
          <p className="text-body-sm text-on-surface-variant">Já vem com o preço padrão. Mude só se este cliente pagou diferente.</p>
          {soldProducts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-label-lg text-on-surface">
                {p.name}
                <span className="ml-1.5 text-body-sm font-normal text-on-surface-variant">× {qty[p.id]}</span>
              </span>
              <div className="w-36 shrink-0">
                <MoneyInput
                  size="sm"
                  aria-label={`Preço por pacote de ${p.name}`}
                  value={unitPrices[p.id]}
                  onChange={(cents) => setPriceOverride((o) => ({ ...o, [p.id]: cents }))}
                />
              </div>
            </div>
          ))}
          {adjusted && (
            <Button variant="ghost" size="sm" onClick={() => setPriceOverride({})}>
              Voltar ao preço padrão
            </Button>
          )}
        </Disclosure>
      )}

      <Disclosure icon={<NotebookPen />} title="Observação (opcional)">
        <Field label="Anotação sobre esta venda">
          <Input placeholder="Ex.: pediu mais cremosinho na próxima" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Disclosure>

      {error && (
        <Banner tone="error" icon={<TriangleAlert />} title="Não foi possível salvar">
          {error}
        </Banner>
      )}

      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-30 -mx-3 bg-gradient-to-t from-surface via-surface/90 to-transparent px-3 pb-2 pt-4">
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={saving}
          disabled={total <= 0 || !routeId}
          icon={<CircleCheck className="size-6" />}
        >
          {total > 0 ? `Salvar venda (${total} ${total === 1 ? "pacote" : "pacotes"})` : "Informe os pacotes"}
        </Button>
      </div>

    </form>
    <PixModal open={pixOpen} amountCents={amount} onClose={() => setPixOpen(false)} />
    {/* Fora do <form> da venda: o envio do formulário da rota não pode disparar o salvar da venda. */}
    <RouteFormModal open={newRouteOpen} onClose={() => setNewRouteOpen(false)} onSaved={(r) => chooseRoute(r.id)} />
    <RouteFormModal
      open={editRouteOpen}
      route={routeList.find((r) => r.id === routeId) ?? null}
      onClose={() => setEditRouteOpen(false)}
      onSaved={() => {
        toast({ title: "Rota atualizada" });
        void syncNow();
      }}
    />
    </>
  );
}
