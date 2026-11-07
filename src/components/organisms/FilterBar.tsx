"use client";

import { useState, type ReactNode } from "react";
import { MapPin, SlidersHorizontal, UserRound, X } from "lucide-react";
import { Button } from "../atoms/Button";
import { Select } from "../atoms/Select";
import { Field } from "../molecules/Field";
import { Modal } from "../molecules/Modal";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { cn } from "@/lib/format";
import { PERIODS, activeExtraFilters, type Filters } from "@/lib/filters";
import type { Route, Seller } from "@/lib/types";

/**
 * Filtro único do app: período sempre à mostra + botão "Filtros" (rota e vendedor) com contador.
 * Os filtros ligados aparecem como etiquetas removíveis logo abaixo.
 * Passe `routes`/`sellers` só nas telas em que fazem sentido.
 */
export function FilterBar({
  value,
  onChange,
  routes,
  sellers,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
  routes?: Route[];
  sellers?: Seller[];
}) {
  const [open, setOpen] = useState(false);
  const extra = activeExtraFilters(value);
  const hasExtraOptions = Boolean(routes?.length || sellers?.length);
  const routeName = routes?.find((r) => r.id === value.routeId)?.name;
  const sellerName = sellers?.find((s) => s.id === value.sellerId)?.name;
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SegmentedControl label="Período" options={PERIODS} value={value.period} onChange={(period) => set({ period })} className="flex-1" />
        {hasExtraOptions && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={extra ? `Filtros (${extra} ativos)` : "Filtros"}
            className={cn(
              "relative flex h-10 shrink-0 items-center gap-1.5 rounded-control px-2.5 text-label-md font-bold transition-colors",
              extra ? "bg-secondary/15 text-secondary" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
            )}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden min-[400px]:inline">Filtros</span>
            {extra > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] text-on-secondary">{extra}</span>
            )}
          </button>
        )}
      </div>

      {extra > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {routeName && <ActiveTag icon={<MapPin />} label={routeName} onRemove={() => set({ routeId: "" })} />}
          {sellerName && <ActiveTag icon={<UserRound />} label={sellerName} onRemove={() => set({ sellerId: "" })} />}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        footer={
          <>
            <Button variant="soft" fullWidth disabled={!extra} onClick={() => set({ routeId: "", sellerId: "" })}>
              Limpar
            </Button>
            <Button fullWidth onClick={() => setOpen(false)}>
              Aplicar
            </Button>
          </>
        }
      >
        {routes && routes.length > 0 && (
          <Field label="Rota">
            <Select icon={<MapPin />} value={value.routeId} onChange={(e) => set({ routeId: e.target.value })}>
              <option value="">Todas as rotas</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.deletedAt ? `${r.name} (excluída)` : r.name}</option>
              ))}
            </Select>
          </Field>
        )}
        {sellers && sellers.length > 0 && (
          <Field label="Vendedor">
            <Select icon={<UserRound />} value={value.sellerId} onChange={(e) => set({ sellerId: e.target.value })}>
              <option value="">Todos os vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
        )}
      </Modal>
    </div>
  );
}

function ActiveTag({ icon, label, onRemove }: { icon: ReactNode; label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-chip bg-surface-container-high pl-2 text-label-md text-on-surface [&>svg]:size-3.5 [&>svg]:text-secondary">
      {icon}
      <span className="max-w-40 truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label={`Remover filtro ${label}`} className="flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface">
        <X className="size-3.5" />
      </button>
    </span>
  );
}
