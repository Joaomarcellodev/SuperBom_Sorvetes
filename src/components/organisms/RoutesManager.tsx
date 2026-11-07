"use client";

import { useMemo, useState } from "react";
import { ArchiveRestore, MapPin, Pencil, Plus, Route as RouteIcon, Trash2 } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { IconButton } from "../atoms/IconButton";
import { StatusDot } from "../atoms/StatusDot";
import { ConfirmDialog } from "../molecules/ConfirmDialog";
import { RouteFormModal } from "./RouteFormModal";
import { useRoutes, useSales } from "@/hooks/useData";
import { deleteRoute, restoreRoute } from "@/lib/repo";
import type { Route } from "@/lib/types";
import { useSync } from "@/providers/SyncProvider";
import { useToast } from "@/providers/ToastProvider";

/** Ajustes > Rotas: criar, editar, excluir e restaurar rotas. */
export function RoutesManager() {
  const routes = useRoutes();
  const sales = useSales();
  const { syncNow } = useSync();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Route | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Route | null>(null);

  const salesByRoute = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales ?? []) map.set(s.routeId, (map.get(s.routeId) ?? 0) + 1);
    return map;
  }, [sales]);

  const active = (routes ?? []).filter((r) => !r.deletedAt);
  const removed = (routes ?? []).filter((r) => r.deletedAt);
  const count = (id: string) => salesByRoute.get(id) ?? 0;
  const salesLabel = (n: number) => `${n} ${n === 1 ? "venda" : "vendas"}`;

  const confirmDelete = async () => {
    if (!toDelete) return;
    const r = toDelete;
    setToDelete(null);
    await deleteRoute(r.id);
    toast({ title: "Rota excluída", description: "Some das listas. As vendas antigas continuam no histórico.", tone: "offline" });
    void syncNow();
  };

  const restore = async (r: Route) => {
    try {
      await restoreRoute(r.id);
      toast({ title: "Rota restaurada", description: `${r.name} volta a aparecer no registro de vendas.` });
      void syncNow();
    } catch (e) {
      toast({ title: "Não foi possível restaurar", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
  };

  return (
    <Card id="rotas" className="scroll-mt-24 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-headline-sm">
          <RouteIcon className="size-5 text-primary" /> Rotas
        </h2>
        <Button size="sm" variant="soft" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          Nova
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-control bg-surface-container-low p-3 text-body-sm text-on-surface-variant">Nenhuma rota ativa. Crie a primeira.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06] rounded-control bg-surface-container-low">
          {active.map((r) => (
            <li key={r.id} className="flex items-center gap-2 py-2 pl-3 pr-1.5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-label-lg text-on-surface">
                  {r.dirty === 1 && <StatusDot tone="primary" size="sm" />}
                  <span className="truncate">{r.name}</span>
                </p>
                <p className="flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
                  {r.cities.length > 0 && (
                    <>
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{r.cities.join(", ")}</span>
                      <span aria-hidden>·</span>
                    </>
                  )}
                  <span className="shrink-0">{salesLabel(count(r.id))}</span>
                </p>
              </div>
              <IconButton label={`Editar rota ${r.name}`} className="size-10 bg-transparent" onClick={() => setEditing(r)}>
                <Pencil className="size-[18px]" />
              </IconButton>
              <IconButton label={`Excluir rota ${r.name}`} tone="danger" className="size-10 bg-transparent" onClick={() => setToDelete(r)}>
                <Trash2 className="size-[18px]" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {removed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-label-md text-secondary select-none [&::-webkit-details-marker]:hidden">
            Rotas excluídas ({removed.length})
          </summary>
          <ul className="mt-2 divide-y divide-white/[0.06] rounded-control bg-surface-container-lowest">
            {removed.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2 pl-3 pr-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label-lg text-on-surface-variant line-through">{r.name}</p>
                  <p className="text-body-sm text-outline">{salesLabel(count(r.id))} no histórico</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArchiveRestore className="size-4" />} onClick={() => void restore(r)}>
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <RouteFormModal open={creating || editing !== null} route={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => {
        toast({ title: editing ? "Rota atualizada" : "Rota criada" });
        void syncNow();
      }} />
      <ConfirmDialog
        open={toDelete !== null}
        danger
        title="Excluir esta rota?"
        details={toDelete ? `${toDelete.name} · ${salesLabel(count(toDelete.id))}` : null}
        description={
          toDelete && count(toDelete.id) > 0
            ? "Some do registro de vendas. As vendas dela continuam no histórico. Dá para restaurar depois."
            : "Some do registro de vendas. Dá para restaurar depois."
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}
