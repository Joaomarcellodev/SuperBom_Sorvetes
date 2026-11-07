"use client";

import { MapPin, UserRound } from "lucide-react";
import { Select } from "../atoms/Select";
import { FilterChip } from "../molecules/FilterChip";
import type { Route, Seller } from "@/lib/types";

export type Period = "today" | "7d" | "month" | "all";

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "month", label: "Este mês" },
  { id: "all", label: "Tudo" },
];

export function FilterBar({
  period,
  onPeriodChange,
  routes,
  routeId,
  onRouteChange,
  sellers,
  sellerId,
  onSellerChange,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
  routes: Route[];
  routeId: string;
  onRouteChange: (id: string) => void;
  sellers: Seller[];
  sellerId: string;
  onSellerChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div role="group" aria-label="Período" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {PERIODS.map((p) => (
          <FilterChip key={p.id} active={period === p.id} onClick={() => onPeriodChange(p.id)}>
            {p.label}
          </FilterChip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select variant="chip" aria-label="Filtrar por rota" icon={<MapPin />} value={routeId} onChange={(e) => onRouteChange(e.target.value)}>
          <option value="">Todas</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Select variant="chip" aria-label="Filtrar por vendedor" icon={<UserRound />} value={sellerId} onChange={(e) => onSellerChange(e.target.value)}>
          <option value="">Todos</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}
