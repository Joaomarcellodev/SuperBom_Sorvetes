"use client";

import { useId } from "react";
import { CirclePlus, MapPin, Route as RouteIcon, Store, Truck } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";
import { Select } from "../atoms/Select";
import { useRoutePoints } from "@/hooks/useData";
import type { Route } from "@/lib/types";

/** Rota/região da entrega (salva no banco) + ponto ou cliente dentro da rota. */
export function RouteSelector({
  routes,
  routeId,
  onRouteChange,
  pointName,
  onPointChange,
  onNewRoute,
}: {
  routes: Route[];
  routeId: string;
  onRouteChange: (id: string) => void;
  pointName: string;
  onPointChange: (name: string) => void;
  onNewRoute: () => void;
}) {
  const listId = useId();
  const selectId = useId();
  const pointId = useId();
  const route = routes.find((r) => r.id === routeId);
  const points = useRoutePoints(routeId || undefined);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={selectId} className="flex items-center gap-1.5 text-label-md">
          <RouteIcon className="size-[18px] text-primary" /> Rota / região da entrega
        </Label>
        <Button variant="ghost" size="sm" icon={<CirclePlus className="size-4" />} onClick={onNewRoute} className="-mr-2 h-9 px-3">
          Nova rota
        </Button>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-control bg-surface-container-lowest p-4 text-center">
          <p className="text-body-md text-on-surface-variant">Nenhuma rota cadastrada ainda.</p>
          <Button className="mt-3" size="sm" icon={<CirclePlus className="size-4" />} onClick={onNewRoute}>
            Criar primeira rota
          </Button>
        </div>
      ) : (
        <>
          <Select id={selectId} icon={<Truck />} value={routeId} onChange={(e) => onRouteChange(e.target.value)}>
            {routes.map((r) => (
              <option key={r.id} value={r.id} className="bg-surface-container text-on-surface">
                {r.name}
              </option>
            ))}
          </Select>

          {route && route.cities.length > 0 && (
            <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                CIDADES: <span className="font-medium normal-case text-primary">{route.cities.join(", ")}</span>
              </span>
            </p>
          )}

          <div className="space-y-2 border-t border-surface-variant/40 pt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={pointId}>Cliente / ponto na rota</Label>
              <span className="text-[11px] font-medium text-secondary">{points.length > 0 ? "Escolha ou digite" : "Opcional"}</span>
            </div>
            <Input
              id={pointId}
              list={listId}
              icon={<Store />}
              placeholder="Ex.: Mercadinho São José"
              autoComplete="off"
              value={pointName}
              onChange={(e) => onPointChange(e.target.value)}
            />
            <datalist id={listId}>
              {points.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
        </>
      )}
    </Card>
  );
}
