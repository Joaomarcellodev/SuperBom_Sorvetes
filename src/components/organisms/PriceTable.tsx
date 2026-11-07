"use client";

import { useEffect, useState } from "react";
import { Save, Tag } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { MoneyInput } from "../atoms/MoneyInput";
import { ProductIcon } from "../atoms/ProductIcon";
import { usePrices } from "@/hooks/useData";
import { priceMap } from "@/lib/finance";
import { PRODUCTS } from "@/lib/products";
import { setProductPrice } from "@/lib/repo";
import type { ProductId } from "@/lib/types";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Preço padrão por pacote. Vem preenchido em cada venda nova e vale para os dois sócios. */
export function PriceTable() {
  const prices = usePrices();
  const { syncNow } = useSync();
  const { toast } = useToast();
  const saved = priceMap(prices);
  const [draft, setDraft] = useState<Record<ProductId, number> | null>(null);
  const [saving, setSaving] = useState(false);

  // Começa com o que está salvo; se o sócio mudar enquanto ninguém está editando, acompanha.
  useEffect(() => {
    if (prices) setDraft((d) => d ?? priceMap(prices));
  }, [prices]);

  const values = draft ?? saved;
  const changed = PRODUCTS.some((p) => values[p.id] !== saved[p.id]);

  const save = async () => {
    setSaving(true);
    try {
      for (const p of PRODUCTS) if (values[p.id] !== saved[p.id]) await setProductPrice(p.id, values[p.id]);
      toast({ title: "Preços salvos", description: "Valem para as próximas vendas dos dois sócios." });
      setDraft(null);
      void syncNow();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="precos" className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-headline-sm">
          <Tag className="size-5 text-primary" /> Preço por pacote
        </h2>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">Preço padrão de cada produto. Na venda dá para ajustar.</p>
      </div>
      <div className="space-y-2">
        {PRODUCTS.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-control bg-surface-container-low p-2 pl-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <ProductIcon id={p.id} size="sm" />
              <span className="truncate text-label-lg text-on-surface">{p.name}</span>
            </span>
            <div className="w-36 shrink-0">
              <MoneyInput
                size="sm"
                aria-label={`Preço por pacote de ${p.name}`}
                value={values[p.id]}
                onChange={(cents) => setDraft({ ...values, [p.id]: cents })}
              />
            </div>
          </div>
        ))}
      </div>
      <Button fullWidth disabled={!changed} loading={saving} icon={<Save className="size-5" />} onClick={() => void save()}>
        Salvar preços
      </Button>
    </Card>
  );
}
