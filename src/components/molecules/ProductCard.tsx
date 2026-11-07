import type { Product } from "@/lib/products";
import { Card } from "../atoms/Card";
import { ProductIcon } from "../atoms/ProductIcon";
import { QuantityStepper } from "./QuantityStepper";
import { tick } from "@/lib/feedback";

const QUICK = [5, 10, 20] as const;

/** Cartão de produto no registro de venda: ícone, nome, contador grande e atalhos +5/+10/+20. */
export function ProductCard({ product, qty, onChange }: { product: Product; qty: number; onChange: (next: number) => void }) {
  return (
    <Card className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProductIcon id={product.id} />
          <h3 className="truncate font-display text-headline-sm">{product.name}</h3>
        </div>
        {qty > 0 && (
          <button
            type="button"
            onClick={() => {
              tick();
              onChange(0);
            }}
            className="rounded-full px-3 py-2 text-label-md text-secondary hover:bg-surface-container-high"
          >
            Zerar
          </button>
        )}
      </div>

      <QuantityStepper value={qty} onChange={onChange} label={product.name} />

      <div className="flex items-center gap-2">
        <span className="mr-1 text-label-sm text-on-surface-variant">RÁPIDO:</span>
        {QUICK.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Adicionar ${n} pacotes de ${product.name}`}
            onClick={() => {
              tick();
              onChange(qty + n);
            }}
            className="h-11 flex-1 rounded-xl bg-surface-container-high text-label-lg transition-transform hover:bg-surface-variant active:scale-95"
          >
            +{n}
          </button>
        ))}
      </div>
    </Card>
  );
}
