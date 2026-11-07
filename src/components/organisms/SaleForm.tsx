"use client";

import { useMemo, useState } from "react";
import { CircleCheck, NotebookPen, Pencil, TriangleAlert, UserRound, Users, WifiOff } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";
import { Banner } from "../molecules/Banner";
import { Disclosure } from "../molecules/Disclosure";
import { Field } from "../molecules/Field";
import { ProductCard } from "../molecules/ProductCard";
import { SectionHeader } from "../molecules/SectionHeader";
import { SellerToggle, type SellerOption } from "../molecules/SellerToggle";
import { NewRouteModal } from "./NewRouteModal";
import { RouteSelector } from "./RouteSelector";
import { useRoutes } from "@/hooks/useData";
import { formatShortDate, todayStr } from "@/lib/format";
import { PRODUCTS, emptyItems, sumItems } from "@/lib/products";
import { saveSale } from "@/lib/repo";
import { useSession } from "@/providers/SessionProvider";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

const LAST_ROUTE_KEY = "superbom.lastRoute";
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
  const routes = useRoutes();
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
        label: others.length === 1 ? `Sócio (${firstName(s.name)})` : s.name,
        icon: <Users />,
      })),
    ];
  }, [seller, sellers]);

  if (!seller) return null;

  const sellerId = sellerChoice ?? seller.id;
  const total = sumItems(qty);
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

    setSaving(true);
    try {
      await saveSale({ routeId, pointName, sellerId, saleDate, note, items: qty });
      if (online && configured) {
        toast({ title: "Venda salva!", description: "Enviando para o servidor.", tone: "success" });
      } else {
        toast({
          title: "Salvo no aparelho!",
          description: "Funciona normalmente sem internet. O envio é automático ao reconectar.",
          tone: "offline",
        });
      }
      setQty(emptyItems());
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

      <RouteSelector
        routes={routeList}
        routeId={routeId}
        onRouteChange={chooseRoute}
        pointName={pointName}
        onPointChange={setPointName}
        onNewRoute={() => setNewRouteOpen(true)}
      />

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
      </Card>

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

      <NewRouteModal open={newRouteOpen} onClose={() => setNewRouteOpen(false)} onCreated={(r) => chooseRoute(r.id)} />
    </form>
  );
}
