import { getDb, getMeta, setMeta, META_EXPENSES_CURSOR, META_LAST_SYNC, META_SALES_CURSOR } from "./db";
import { getSupabase } from "./supabase";
import { saleSignature } from "./payment";
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  PaymentStatus,
  ProductId,
  ProductPrice,
  Route,
  RoutePoint,
  Sale,
  SaleItems,
  Seller,
  UnitPrices,
} from "./types";

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
  /** só existe depois da migração 0004 */
  deleted_at?: string | null;
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
  /** só existem depois da migração 0003 */
  unit_prices?: UnitPrices;
  amount_cents?: number;
  /** só existem depois da migração 0007 */
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod | null;
  paid_at?: string | null;
}
interface RemoteExpense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount_cents: number;
  expense_date: string;
  seller_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
interface RemotePrice {
  product_id: ProductId;
  price_cents: number;
}

const PAGE = 1000;

/** Erro de coluna/tabela que ainda não existe no Supabase (migração nova não rodada). */
const isSchemaError = (error: { message: string; code?: string } | null): boolean =>
  Boolean(error && (/schema cache|does not exist/i.test(error.message) || /^(PGRST20[45]|42P01|42703)$/.test(error.code ?? "")));

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  /** vendas e gastos deste aparelho que chegaram ao servidor nesta rodada (para o aviso na tela) */
  sent: number;
  /** vendas e gastos novos ou alterados que vieram de outro aparelho nesta rodada */
  received: number;
}

export async function syncAll(): Promise<SyncResult> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase não configurado (.env.local).");

  const db = getDb();
  let pushed = 0;
  let pulled = 0;
  let sent = 0;
  let received = 0;
  /** Falha de uma parte opcional (ex.: migração ainda não rodada): avisada só depois de baixar tudo. */
  let late: Error | null = null;

  // ---------- 1. ENVIAR ----------
  const dirtyRoutes = await db.routes.where("dirty").equals(1).toArray();
  if (dirtyRoutes.length) {
    const base = dirtyRoutes.map((r) => ({ id: r.id, name: r.name, cities: r.cities, created_at: r.createdAt }));
    let { error } = await sb.from("routes").upsert(base.map((row, k) => ({ ...row, deleted_at: dirtyRoutes[k]?.deletedAt ?? null })));
    // Migração 0004 ainda não rodou: nome/cidades sobem, a exclusão fica pendente até o banco ser atualizado.
    const withoutDelete = isSchemaError(error);
    if (withoutDelete) {
      late ??= new Error(error!.message);
      ({ error } = await sb.from("routes").upsert(base));
    }
    fail(error);
    // Só marca como enviada se ninguém mexeu na rota durante o envio.
    const sent = new Map(dirtyRoutes.map((r) => [r.id, `${r.name}|${r.cities.join(",")}|${r.deletedAt ?? ""}`]));
    await db.routes
      .where("id")
      .anyOf([...sent.keys()])
      .modify((current) => {
        const same = sent.get(current.id) === `${current.name}|${current.cities.join(",")}|${current.deletedAt ?? ""}`;
        if (same && (!withoutDelete || !current.deletedAt)) current.dirty = 0;
      });
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
    const base = batch.map((s) => ({
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
    }));
    const withValue = base.map((row, k) => ({ ...row, unit_prices: batch[k]?.unitPrices ?? {}, amount_cents: batch[k]?.amountCents ?? 0 }));
    const full = withValue.map((row, k) => ({
      ...row,
      payment_status: batch[k]?.paymentStatus ?? "pago",
      payment_method: batch[k]?.paymentMethod ?? null,
      paid_at: batch[k]?.paidAt ?? null,
    }));
    let { error } = await sb.from("sales").upsert(full);
    const incomplete = isSchemaError(error);
    if (incomplete) {
      // Migração 0007 (pagamento) ou 0003 (valor) ainda não rodou: os pacotes sobem mesmo assim,
      // mas a venda segue pendente para reenviar o resto quando o banco for atualizado.
      late ??= new Error(error!.message);
      ({ error } = await sb.from("sales").upsert(withValue));
      if (isSchemaError(error)) ({ error } = await sb.from("sales").upsert(base));
    }
    fail(error);
    pushed += batch.length;
    if (incomplete) continue;
    // Só marca como enviada se ninguém mexeu na venda enquanto o envio rodava
    // (ex.: apagar a venda ou quitar a pendência logo depois de tocar em "Sincronizar").
    const signatures = new Map(batch.map((s) => [s.id, saleSignature(s)]));
    await db.sales
      .where("id")
      .anyOf(batch.map((s) => s.id))
      .modify((current) => {
        if (signatures.get(current.id) === saleSignature(current)) current.dirty = 0;
      });
    sent += batch.length;
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

  try {
    const finance = await pushFinance(sb, db);
    pushed += finance.pushed;
    sent += finance.expenses;
  } catch (e) {
    late ??= e instanceof Error ? e : new Error(String(e));
  }

  // Cargo editado (migração 0005 libera a coluna "role" para o app).
  const dirtyRoles = await db.sellers.filter((s) => s.roleDirty === 1).toArray();
  for (const s of dirtyRoles) {
    const { error } = await sb.from("sellers").update({ role: s.role }).eq("id", s.id);
    if (error) {
      late ??= new Error(error.message);
      break;
    }
    await db.sellers
      .where("id")
      .equals(s.id)
      .modify((current) => {
        if (current.role === s.role) current.roleDirty = 0;
      });
    pushed += 1;
  }

  // ---------- 2. BAIXAR ----------
  const [sellersRes, routesRes, pointsRes] = await Promise.all([
    // "*" e não a lista de colunas: funciona com ou sem a coluna avatar_url (migração 0002).
    sb.from("sellers").select("*"),
    // "*": funciona com ou sem a coluna deleted_at (migração 0004).
    sb.from("routes").select("*"),
    sb.from("route_points").select("id,route_id,name"),
  ]);
  fail(sellersRes.error);
  fail(routesRes.error);
  fail(pointsRes.error);

  const remoteSellers = (sellersRes.data ?? []) as RemoteSeller[];
  const remoteRoutes = (routesRes.data ?? []) as RemoteRoute[];
  const remotePoints = (pointsRes.data ?? []) as RemotePoint[];

  await db.transaction("rw", db.sellers, db.routes, db.points, async () => {
    // Foto ou cargo trocados aqui e ainda não enviados vencem os do servidor.
    const localAvatars = new Map(
      (await db.sellers.filter((s) => s.avatarDirty === 1).toArray()).map((s) => [s.id, s.avatarUrl ?? null]),
    );
    const localRoles = new Map((await db.sellers.filter((s) => s.roleDirty === 1).toArray()).map((s) => [s.id, s.role]));
    const sellers: Seller[] = remoteSellers.map((s) => {
      const dirty = localAvatars.has(s.id);
      return {
        id: s.id,
        name: s.name,
        role: localRoles.get(s.id) ?? s.role,
        roleDirty: localRoles.has(s.id) ? 1 : 0,
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
      .map((r) => ({ id: r.id, name: r.name, cities: r.cities ?? [], createdAt: r.created_at, deletedAt: r.deleted_at ?? null, dirty: 0 }));
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
        const local = new Map((await db.sales.bulkGet(rows.map((r) => r.id))).flatMap((s) => (s ? [[s.id, s] as const] : [])));
        const sales: Sale[] = rows
          .filter((r) => local.get(r.id)?.dirty !== 1)
          .map((r) => ({
            unitPrices: r.unit_prices ?? {},
            amountCents: r.amount_cents ?? 0,
            paymentStatus: r.payment_status ?? "pago",
            paymentMethod: r.payment_method ?? null,
            paidAt: r.paid_at ?? null,
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
        // Conta só o que é novidade para este aparelho (o que ele mesmo enviou volta igual).
        received += sales.filter((s) => {
          const before = local.get(s.id);
          return !before || saleSignature(before) !== saleSignature(s) || before.total !== s.total;
        }).length;
        await db.sales.bulkPut(sales);
      });
      pulled += rows.length;
      const last = rows[rows.length - 1]?.updated_at;
      if (last && last > maxSeen) maxSeen = last;
    }
    if (rows.length < PAGE) break;
  }
  if (maxSeen) await setMeta(META_SALES_CURSOR, maxSeen);

  try {
    const finance = await pullFinance(sb, db);
    pulled += finance.pulled;
    received += finance.expenses;
  } catch (e) {
    late ??= e instanceof Error ? e : new Error(String(e));
  }

  await setMeta(META_LAST_SYNC, new Date().toISOString());
  if (late) throw late;
  return { pushed, pulled, sent, received };
}

type Sb = NonNullable<ReturnType<typeof getSupabase>>;
type Db = ReturnType<typeof getDb>;

/** Envia preços padrão e gastos criados/apagados no aparelho. */
async function pushFinance(sb: Sb, db: Db): Promise<{ pushed: number; expenses: number }> {
  let pushed = 0;
  let expenses = 0;

  const dirtyPrices = await db.prices.where("dirty").equals(1).toArray();
  if (dirtyPrices.length) {
    const { error } = await sb
      .from("product_prices")
      .upsert(dirtyPrices.map((p) => ({ product_id: p.productId, price_cents: p.priceCents })));
    fail(error);
    const sent = new Map(dirtyPrices.map((p) => [p.productId, p.priceCents]));
    await db.prices
      .where("productId")
      .anyOf([...sent.keys()])
      .modify((current) => {
        if (current.priceCents === sent.get(current.productId)) current.dirty = 0;
      });
    pushed += dirtyPrices.length;
  }

  const dirtyExpenses = await db.expenses.where("dirty").equals(1).toArray();
  for (let i = 0; i < dirtyExpenses.length; i += 200) {
    const batch = dirtyExpenses.slice(i, i + 200);
    const { error } = await sb.from("expenses").upsert(
      batch.map((e) => ({
        id: e.id,
        description: e.description,
        category: e.category,
        amount_cents: e.amountCents,
        expense_date: e.expenseDate,
        seller_id: e.sellerId,
        note: e.note,
        created_at: e.createdAt,
        deleted_at: e.deletedAt,
      })),
    );
    fail(error);
    const sent = new Map(batch.map((e) => [e.id, e.deletedAt]));
    await db.expenses
      .where("id")
      .anyOf(batch.map((e) => e.id))
      .modify((current) => {
        if (current.deletedAt === sent.get(current.id)) current.dirty = 0;
      });
    pushed += batch.length;
    expenses += batch.length;
  }
  return { pushed, expenses };
}

/** Baixa a tabela de preços (inteira, é pequena) e os gastos novos desde a última vez. */
async function pullFinance(sb: Sb, db: Db): Promise<{ pulled: number; expenses: number }> {
  let pulled = 0;
  let received = 0;

  const { data: priceRows, error: priceError } = await sb.from("product_prices").select("product_id,price_cents");
  fail(priceError);
  await db.transaction("rw", db.prices, async () => {
    const localDirty = new Set(await db.prices.where("dirty").equals(1).primaryKeys());
    const prices: ProductPrice[] = ((priceRows ?? []) as RemotePrice[])
      .filter((p) => !localDirty.has(p.product_id))
      .map((p) => ({ productId: p.product_id, priceCents: p.price_cents, dirty: 0 }));
    await db.prices.bulkPut(prices);
    pulled += prices.length;
  });

  const cursor = await getMeta<string>(META_EXPENSES_CURSOR);
  let maxSeen = cursor ?? "";
  for (let from = 0; ; from += PAGE) {
    let query = sb.from("expenses").select("*").order("updated_at", { ascending: true }).order("id");
    if (cursor) query = query.gte("updated_at", cursor);
    const { data, error } = await query.range(from, from + PAGE - 1);
    fail(error);
    const rows = (data ?? []) as RemoteExpense[];
    if (rows.length) {
      await db.transaction("rw", db.expenses, async () => {
        const local = new Map((await db.expenses.bulkGet(rows.map((r) => r.id))).flatMap((e) => (e ? [[e.id, e] as const] : [])));
        const expenses: Expense[] = rows
          .filter((r) => local.get(r.id)?.dirty !== 1)
          .map((r) => ({
            id: r.id,
            description: r.description,
            category: r.category,
            amountCents: r.amount_cents,
            expenseDate: r.expense_date,
            sellerId: r.seller_id,
            note: r.note,
            createdAt: r.created_at,
            deletedAt: r.deleted_at,
            dirty: 0,
          }));
        received += expenses.filter((e) => {
          const before = local.get(e.id);
          return !before || before.deletedAt !== e.deletedAt || before.amountCents !== e.amountCents;
        }).length;
        await db.expenses.bulkPut(expenses);
      });
      pulled += rows.length;
      const last = rows[rows.length - 1]?.updated_at;
      if (last && last > maxSeen) maxSeen = last;
    }
    if (rows.length < PAGE) break;
  }
  if (maxSeen) await setMeta(META_EXPENSES_CURSOR, maxSeen);
  return { pulled, expenses: received };
}
