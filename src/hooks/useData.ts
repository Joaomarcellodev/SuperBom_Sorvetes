"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type { Route, RoutePoint, Sale, Seller } from "@/lib/types";

/**
 * Leituras reativas do banco local: a tela atualiza sozinha quando uma venda é salva
 * ou quando a sincronização traz dados novos. `undefined` = ainda carregando.
 */

export function useSales(): Sale[] | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().sales.toArray();
    return all
      .filter((s) => !s.deletedAt)
      .sort((a, b) => (a.saleDate + a.createdAt < b.saleDate + b.createdAt ? 1 : -1));
  }, []);
}

export function useRoutes(): Route[] | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().routes.toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, []);
}

export function useSellers(): Seller[] | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().sellers.toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, []);
}

export function useRoutePoints(routeId: string | undefined): RoutePoint[] {
  return (
    useLiveQuery(
      async () => {
        if (!routeId) return [];
        const list = await getDb().points.where("routeId").equals(routeId).toArray();
        const seen = new Set<string>();
        return list
          .filter((p) => {
            const key = p.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      },
      [routeId],
    ) ?? []
  );
}
