import { getDb, getMeta, setMeta, META_LAST_SYNC, META_SALES_CURSOR } from "./db";
import { getSupabase } from "./supabase";
import type { Route, RoutePoint, Sale, SaleItems, Seller } from "./types";

/**
 * Sincronização em duas etapas, sempre nesta ordem:
 *  1. ENVIA o que foi criado no aparelho (rotas -> pontos -> vendas, por causa das chaves estrangeiras)
 *  2. BAIXA o que os outros aparelhos criaram
 *
 * Tudo usa UUID gerado no aparelho + upsert, então repetir o envio (queda de rede no meio,
 * dois toques no botão) nunca duplica nada.
 */

interface RemoteSeller {
  id: string;
  name: string;
  role: string;
  pin_hash: string;
  /** só existe depois da migração 0002 */
  avatar_url?: string | null;
}
interface RemoteRoute {
  id: string;
  name: string;
  cities: string[];
  created_at: string;
}
interface RemotePoint {
  id: string;
  route_id: string;
  name: string;
}
interface RemoteSale {
  id: string;
  route_id: string;
  point_name: string;
  seller_id: string;
  sale_date: string;
  note: string;
  items: SaleItems;
  total: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const PAGE = 1000;

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

export async function syncAll(): Promise<SyncResult> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase não configurado (.env.local).");

  const db = getDb();
  let pushed = 0;
  let pulled = 0;
  /** Falha de uma parte opcional (ex.: migração ainda não rodada): avisada só depois de baixar tudo. */
  let late: Error | null = null;

  // ---------- 1. ENVIAR ----------
  const dirtyRoutes = await db.routes.where("dirty").equals(1).toArray();
  if (dirtyRoutes.length) {
    const { error } = await sb.from("routes").upsert(
      dirtyRoutes.map((r) => ({ id: r.id, name: r.name, cities: r.cities, created_at: r.createdAt })),
    );
    fail(error);
    await db.routes.where("id").anyOf(dirtyRoutes.map((r) => r.id)).modify({ dirty: 0 });
    pushed += dirtyRoutes.length;
  }

  const dirtyPoints = await db.points.where("dirty").equals(1).toArray();
  if (dirtyPoints.length) {
    const { error } = await sb
      .from("route_points")
      .upsert(dirtyPoints.map((p) => ({ id: p.id, route_id: p.routeId, name: p.name })));
    fail(error);
    await db.points.where("id").anyOf(dirtyPoints.map((p) => p.id)).modify({ dirty: 0 });
    pushed += dirtyPoints.length;
  }

  const dirtySales = await db.sales.where("dirty").equals(1).toArray();
  for (let i = 0; i < dirtySales.length; i += 200) {
    const batch = dirtySales.slice(i, i + 200);
    const { error } = await sb.from("sales").upsert(
      batch.map((s) => ({
        id: s.id,
        route_id: s.routeId,
        point_name: s.pointName,
        seller_id: s.sellerId,
        sale_date: s.saleDate,
        note: s.note,
        items: s.items,
        total: s.total,
        created_at: s.createdAt,
        deleted_at: s.deletedAt,
      })),
    );
    fail(error);
    // Só marca como enviada se ninguém mexeu na venda enquanto o envio rodava
    // (ex.: apagar a venda logo depois de tocar em "Sincronizar").
    const sent = new Map(batch.map((s) => [s.id, s.deletedAt]));
    await db.sales
      .where("id")
      .anyOf(batch.map((s) => s.id))
      .modify((current) => {
        if (current.deletedAt === sent.get(current.id)) current.dirty = 0;
      });
    pushed += batch.length;
  }

  // Fotos de perfil (depois das vendas: se a migração 0002 ainda não rodou, as vendas já subiram).
  const dirtyAvatars = await db.sellers.filter((s) => s.avatarDirty === 1).toArray();
  for (const s of dirtyAvatars) {
    const { error } = await sb.from("sellers").update({ avatar_url: s.avatarUrl ?? null }).eq("id", s.id);
    if (error) {
      // Não trava o resto: guarda o erro, baixa as vendas do sócio e avisa no final.
      late ??= new Error(error.message);
      break;
    }
    await db.sellers
      .where("id")
      .equals(s.id)
      .modify((current) => {
        if (current.avatarUrl === s.avatarUrl) current.avatarDirty = 0;
      });
    pushed += 1;
  }

  // ---------- 2. BAIXAR ----------
  const [sellersRes, routesRes, pointsRes] = await Promise.all([
    // "*" e não a lista de colunas: funciona com ou sem a coluna avatar_url (migração 0002).
    sb.from("sellers").select("*"),
    sb.from("routes").select("id,name,cities,created_at"),
    sb.from("route_points").select("id,route_id,name"),
  ]);
  fail(sellersRes.error);
  fail(routesRes.error);
  fail(pointsRes.error);

  const remoteSellers = (sellersRes.data ?? []) as RemoteSeller[];
  const remoteRoutes = (routesRes.data ?? []) as RemoteRoute[];
  const remotePoints = (pointsRes.data ?? []) as RemotePoint[];

  await db.transaction("rw", db.sellers, db.routes, db.points, async () => {
    // Foto trocada aqui e ainda não enviada vence a do servidor.
    const localAvatars = new Map(
      (await db.sellers.filter((s) => s.avatarDirty === 1).toArray()).map((s) => [s.id, s.avatarUrl ?? null]),
    );
    const sellers: Seller[] = remoteSellers.map((s) => {
      const dirty = localAvatars.has(s.id);
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        pinHash: s.pin_hash,
        avatarUrl: dirty ? localAvatars.get(s.id) : (s.avatar_url ?? null),
        avatarDirty: dirty ? 1 : 0,
      };
    });
    await db.sellers.clear();
    await db.sellers.bulkPut(sellers);

    const localDirtyRoutes = new Set(await db.routes.where("dirty").equals(1).primaryKeys());
    const routes: Route[] = remoteRoutes
      .filter((r) => !localDirtyRoutes.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, cities: r.cities ?? [], createdAt: r.created_at, dirty: 0 }));
    await db.routes.bulkPut(routes);

    const localDirtyPoints = new Set(await db.points.where("dirty").equals(1).primaryKeys());
    const points: RoutePoint[] = remotePoints
      .filter((p) => !localDirtyPoints.has(p.id))
      .map((p) => ({ id: p.id, routeId: p.route_id, name: p.name, dirty: 0 }));
    await db.points.bulkPut(points);
  });
  pulled += remoteSellers.length + remoteRoutes.length + remotePoints.length;

  // Vendas: só o que mudou desde a última vez (cursor = maior updated_at já visto).
  const cursor = await getMeta<string>(META_SALES_CURSOR);
  let maxSeen = cursor ?? "";
  for (let from = 0; ; from += PAGE) {
    let query = sb.from("sales").select("*").order("updated_at", { ascending: true }).order("id");
    if (cursor) query = query.gte("updated_at", cursor);
    const { data, error } = await query.range(from, from + PAGE - 1);
    fail(error);
    const rows = (data ?? []) as RemoteSale[];

    if (rows.length) {
      await db.transaction("rw", db.sales, async () => {
        const localDirty = new Set(
          await db.sales.where("id").anyOf(rows.map((r) => r.id)).filter((s) => s.dirty === 1).primaryKeys(),
        );
        const sales: Sale[] = rows
          .filter((r) => !localDirty.has(r.id))
          .map((r) => ({
            id: r.id,
            routeId: r.route_id,
            pointName: r.point_name,
            sellerId: r.seller_id,
            saleDate: r.sale_date,
            note: r.note,
            items: r.items ?? {},
            total: r.total,
            createdAt: r.created_at,
            deletedAt: r.deleted_at,
            dirty: 0,
          }));
        await db.sales.bulkPut(sales);
      });
      pulled += rows.length;
      const last = rows[rows.length - 1]?.updated_at;
      if (last && last > maxSeen) maxSeen = last;
    }
    if (rows.length < PAGE) break;
  }
  if (maxSeen) await setMeta(META_SALES_CURSOR, maxSeen);

  await setMeta(META_LAST_SYNC, new Date().toISOString());
  if (late) throw late;
  return { pushed, pulled };
}
