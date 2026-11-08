import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { getDb } from "./db";
import { hashPin } from "./pin";
import {
  createRoute,
  deleteExpense,
  deleteRoute,
  deleteSale,
  restoreRoute,
  saveExpense,
  saveSale,
  setProductPrice,
  settleSale,
  updateRoute,
  updateSellerAvatar,
  updateSellerRole,
} from "./repo";
import { syncAll } from "./sync";

const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("./supabase", () => ({ getSupabase: () => holder.client, isSupabaseConfigured: true }));

const JOAO = "11111111-1111-1111-1111-111111111111";
const PEDRO = "22222222-2222-2222-2222-222222222222";
let fake: FakeSupabase;

async function server(options?: Parameters<typeof createFakeSupabase>[0]) {
  fake = createFakeSupabase(options);
  holder.client = fake.client;
  fake.seed("sellers", [
    { id: JOAO, name: "João", role: "Sócio administrador", pin_hash: await hashPin("4821"), avatar_url: null },
    { id: PEDRO, name: "Pedro Lucas", role: "CEO", pin_hash: await hashPin("7390"), avatar_url: null },
  ]);
  fake.seed("product_prices", [
    { product_id: "simples", price_cents: 0 },
    { product_id: "cobertura", price_cents: 0 },
    { product_id: "cremosinho", price_cents: 0 },
  ]);
}

const sale = (routeId: string, extra: Partial<Parameters<typeof saveSale>[0]> = {}) =>
  saveSale({
    routeId,
    pointName: "Mercadinho São José",
    sellerId: JOAO,
    saleDate: "2026-11-07",
    note: "",
    items: { simples: 10, cobertura: 2 },
    unitPrices: { simples: 300, cobertura: 450 },
    ...extra,
  });

beforeEach(async () => {
  const db = getDb();
  await Promise.all(db.tables.map((t) => t.clear()));
  await server();
});

describe("primeira sincronização", () => {
  it("baixa os perfis e a tabela de preços", async () => {
    await syncAll();
    const sellers = await getDb().sellers.toArray();
    expect(sellers.map((s) => s.name).sort()).toEqual(["João", "Pedro Lucas"]);
    expect(await getDb().prices.count()).toBe(3);
  });
});

describe("vendas", () => {
  it("envia rota, ponto e venda com preço e valor, e marca como enviados", async () => {
    await syncAll();
    const route = await createRoute("Zona Norte", ["Teresina", " Timon "]);
    const s = await sale(route.id);
    expect(s.total).toBe(12);
    expect(s.amountCents).toBe(10 * 300 + 2 * 450);

    const result = await syncAll();
    expect(result.pushed).toBeGreaterThanOrEqual(3);
    expect(fake.rows("routes")[0]).toMatchObject({ name: "Zona Norte", cities: ["Teresina", "Timon"], deleted_at: null });
    expect(fake.rows("route_points")[0]).toMatchObject({ route_id: route.id, name: "Mercadinho São José" });
    expect(fake.rows("sales")[0]).toMatchObject({ id: s.id, total: 12, amount_cents: 3900, unit_prices: { simples: 300, cobertura: 450 } });

    const db = getDb();
    expect((await db.sales.get(s.id))?.dirty).toBe(0);
    expect((await db.routes.get(route.id))?.dirty).toBe(0);
  });

  it("repetir a sincronização não duplica nada", async () => {
    const route = await createRoute("Centro", []);
    await sale(route.id);
    await syncAll();
    await syncAll();
    await syncAll();
    expect(fake.rows("sales")).toHaveLength(1);
    expect(fake.rows("routes")).toHaveLength(1);
    expect(await getDb().sales.count()).toBe(1);
  });

  it("baixa a venda que o sócio registrou", async () => {
    fake.seed("routes", [{ id: "r-pedro", name: "Sul", cities: [], created_at: "2026-11-01T10:00:00Z", deleted_at: null }]);
    fake.seed("sales", [
      {
        id: "s-pedro",
        route_id: "r-pedro",
        point_name: "",
        seller_id: PEDRO,
        sale_date: "2026-11-07",
        note: "",
        items: { cremosinho: 5 },
        total: 5,
        created_at: "2026-11-07T11:00:00Z",
        deleted_at: null,
        unit_prices: { cremosinho: 250 },
        amount_cents: 1250,
      },
    ]);
    await syncAll();
    const local = await getDb().sales.get("s-pedro");
    expect(local).toMatchObject({ sellerId: PEDRO, total: 5, amountCents: 1250, dirty: 0 });
  });

  it("apagar venda chega ao servidor como exclusão lógica", async () => {
    const route = await createRoute("Centro", []);
    const s = await sale(route.id);
    await syncAll();
    await deleteSale(s.id);
    await syncAll();
    expect(fake.rows("sales")[0]?.deleted_at).toBeTruthy();
    expect((await getDb().sales.get(s.id))?.dirty).toBe(0);
  });

  it("não exige pacote zero: venda sem pacotes é recusada", async () => {
    const route = await createRoute("Centro", []);
    await expect(sale(route.id, { items: {} })).rejects.toThrow(/pacote/);
  });

  it("ponto novo vira cadastro uma vez só (sem diferenciar maiúsculas)", async () => {
    const route = await createRoute("Centro", []);
    await sale(route.id, { pointName: "Bar do Zé" });
    await sale(route.id, { pointName: "bar do zé" });
    expect(await getDb().points.where("routeId").equals(route.id).count()).toBe(1);
  });
});

describe("pagamento e pendências", () => {
  it("venda paga na hora sobe com a forma de pagamento", async () => {
    const route = await createRoute("Centro", []);
    const s = await sale(route.id, { paymentMethod: "pix" });
    await syncAll();
    expect(fake.rows("sales")[0]).toMatchObject({ id: s.id, payment_status: "pago", payment_method: "pix", paid_at: null });
    expect((await getDb().sales.get(s.id))?.dirty).toBe(0);
  });

  it("sem forma informada conta como dinheiro", async () => {
    const route = await createRoute("Centro", []);
    const s = await sale(route.id);
    expect(s).toMatchObject({ paymentStatus: "pago", paymentMethod: "dinheiro" });
  });

  it("pendência sobe em aberto e, quitada depois, sobe como paga", async () => {
    const route = await createRoute("Centro", []);
    const s = await sale(route.id, { paymentMethod: null });
    expect(s).toMatchObject({ paymentStatus: "pendente", paymentMethod: null });
    await syncAll();
    expect(fake.rows("sales")[0]).toMatchObject({ payment_status: "pendente", payment_method: null });

    await settleSale(s.id, "dinheiro");
    expect((await getDb().sales.get(s.id))?.dirty).toBe(1);
    await syncAll();
    expect(fake.rows("sales")[0]).toMatchObject({ payment_status: "pago", payment_method: "dinheiro" });
    expect(fake.rows("sales")[0]?.paid_at).toBeTruthy();
    expect((await getDb().sales.get(s.id))?.dirty).toBe(0);
  });

  it("baixa a pendência quitada pelo sócio", async () => {
    fake.seed("routes", [{ id: "r1", name: "Sul", cities: [], created_at: "2026-11-01T10:00:00Z", deleted_at: null }]);
    const row = {
      id: "s1",
      route_id: "r1",
      point_name: "Bar",
      seller_id: PEDRO,
      sale_date: "2026-11-06",
      note: "",
      items: { simples: 5 },
      total: 5,
      created_at: "2026-11-06T11:00:00Z",
      deleted_at: null,
      payment_status: "pendente",
      payment_method: null,
      paid_at: null,
    };
    fake.seed("sales", [row]);
    await syncAll();
    expect(await getDb().sales.get("s1")).toMatchObject({ paymentStatus: "pendente", paymentMethod: null });

    await fake.client.from("sales").upsert({ ...row, payment_status: "pago", payment_method: "pix", paid_at: "2026-11-07T15:00:00Z" });
    await syncAll();
    expect(await getDb().sales.get("s1")).toMatchObject({ paymentStatus: "pago", paymentMethod: "pix", paidAt: "2026-11-07T15:00:00Z" });
  });

  it("venda antiga, sem os campos, chega como paga", async () => {
    fake.seed("routes", [{ id: "r1", name: "Sul", cities: [], created_at: "2026-11-01T10:00:00Z", deleted_at: null }]);
    fake.seed("sales", [
      { id: "old", route_id: "r1", point_name: "", seller_id: PEDRO, sale_date: "2026-11-01", note: "", items: { simples: 1 }, total: 1, created_at: "2026-11-01T11:00:00Z", deleted_at: null },
    ]);
    await syncAll();
    expect(await getDb().sales.get("old")).toMatchObject({ paymentStatus: "pago", paymentMethod: null });
  });
});

describe("aviso de sincronização", () => {
  it("conta o que este aparelho enviou e o que veio do sócio, sem contar o próprio envio de volta", async () => {
    await syncAll();
    const route = await createRoute("Centro", []);
    await sale(route.id);
    await saveExpense({ description: "Gasolina", category: "combustivel", amountCents: 5000, expenseDate: "2026-11-07", sellerId: JOAO, note: "" });
    const first = await syncAll();
    expect(first).toMatchObject({ sent: 2, received: 0 });

    const nothing = await syncAll();
    expect(nothing).toMatchObject({ sent: 0, received: 0 });

    fake.seed("sales", [
      { id: "s-pedro", route_id: route.id, point_name: "", seller_id: PEDRO, sale_date: "2026-11-07", note: "", items: { simples: 2 }, total: 2, created_at: "2026-11-07T13:00:00Z", deleted_at: null },
    ]);
    expect(await syncAll()).toMatchObject({ sent: 0, received: 1 });
  });
});

describe("migração faltando", () => {
  it("sem a 0003: os pacotes sobem, a venda fica pendente e o erro aparece só no fim", async () => {
    await server({ missingColumns: { sales: ["unit_prices", "amount_cents"] } });
    fake.seed("routes", [{ id: "r-pedro", name: "Sul", cities: [], created_at: "2026-11-01T10:00:00Z", deleted_at: null }]);
    const route = await createRoute("Centro", []);
    const s = await sale(route.id);

    await expect(syncAll()).rejects.toThrow(/amount_cents|unit_prices/);
    expect(fake.rows("sales")[0]).toMatchObject({ id: s.id, total: 12 });
    expect(fake.rows("sales")[0]).not.toHaveProperty("amount_cents");
    expect((await getDb().sales.get(s.id))?.dirty).toBe(1); // reenvia o valor quando o banco for atualizado
    expect(await getDb().routes.get("r-pedro")).toBeTruthy(); // e mesmo assim baixou o que o sócio fez
  });

  it("sem a 0007: a venda sobe com o valor e fica pendente para reenviar o pagamento", async () => {
    await server({ missingColumns: { sales: ["payment_status", "payment_method", "paid_at"] } });
    const route = await createRoute("Centro", []);
    const s = await sale(route.id, { paymentMethod: null });

    await expect(syncAll()).rejects.toThrow(/payment_status|payment_method|paid_at/);
    expect(fake.rows("sales")[0]).toMatchObject({ id: s.id, amount_cents: 3900 });
    expect(fake.rows("sales")[0]).not.toHaveProperty("payment_status");
    expect((await getDb().sales.get(s.id))?.dirty).toBe(1);
  });

  it("sem a 0004: editar rota sobe, excluir fica pendente", async () => {
    await server({ missingColumns: { routes: ["deleted_at"] } });
    const route = await createRoute("Centro", []);
    await syncAll().catch(() => undefined);
    await updateRoute(route.id, "Centro Novo", []);
    await syncAll().catch(() => undefined);
    expect(fake.rows("routes")[0]?.name).toBe("Centro Novo");
    expect((await getDb().routes.get(route.id))?.dirty).toBe(0);

    await deleteRoute(route.id);
    await expect(syncAll()).rejects.toThrow(/deleted_at/);
    expect((await getDb().routes.get(route.id))?.dirty).toBe(1);
  });

  it("sem a 0005: cargo editado fica no aparelho e o resto sincroniza", async () => {
    await server({ readOnlyColumns: { sellers: ["role"] } });
    await syncAll();
    await updateSellerRole(JOAO, "Sócio fundador");
    await expect(syncAll()).rejects.toThrow(/permission denied/);
    const joao = await getDb().sellers.get(JOAO);
    expect(joao).toMatchObject({ role: "Sócio fundador", roleDirty: 1 }); // não foi sobrescrito pelo servidor
    expect(fake.rows("sellers").find((s) => s.id === JOAO)?.role).toBe("Sócio administrador");
  });
});

describe("rotas", () => {
  it("editar, excluir e restaurar", async () => {
    const a = await createRoute("Norte", []);
    await createRoute("Sul", []);
    await expect(updateRoute(a.id, "sul", [])).rejects.toThrow(/Já existe/);
    await updateRoute(a.id, "Norte 2", ["Timon"]);
    await syncAll();
    expect(fake.rows("routes").find((r) => r.id === a.id)).toMatchObject({ name: "Norte 2", cities: ["Timon"] });

    await deleteRoute(a.id);
    await syncAll();
    expect(fake.rows("routes").find((r) => r.id === a.id)?.deleted_at).toBeTruthy();
    // nome de rota excluída fica livre para uma rota nova
    await expect(createRoute("Norte 2", [])).resolves.toBeTruthy();
    // ...e por isso restaurar a antiga com o mesmo nome é bloqueado
    await expect(restoreRoute(a.id)).rejects.toThrow(/Já existe/);
  });

  it("exclusão feita pelo sócio chega a este aparelho", async () => {
    const r = await createRoute("Leste", []);
    await syncAll();
    fake.rows("routes")[0]!.deleted_at = "2026-11-07T13:00:00Z";
    await syncAll();
    expect((await getDb().routes.get(r.id))?.deletedAt).toBe("2026-11-07T13:00:00Z");
  });
});

describe("financeiro", () => {
  it("envia e baixa preços e gastos", async () => {
    await syncAll();
    await setProductPrice("simples", 350);
    const e = await saveExpense({
      description: "Gasolina",
      category: "combustivel",
      amountCents: 4590,
      expenseDate: "2026-11-07",
      sellerId: JOAO,
      note: "",
    });
    await syncAll();
    expect(fake.rows("product_prices").find((p) => p.product_id === "simples")?.price_cents).toBe(350);
    expect(fake.rows("expenses")[0]).toMatchObject({ id: e.id, amount_cents: 4590, category: "combustivel" });

    await deleteExpense(e.id);
    await syncAll();
    expect(fake.rows("expenses")[0]?.deleted_at).toBeTruthy();

    // preço mudado pelo sócio chega aqui
    fake.rows("product_prices").find((p) => p.product_id === "cobertura")!.price_cents = 500;
    await syncAll();
    expect((await getDb().prices.get("cobertura"))?.priceCents).toBe(500);
  });

  it("gasto sem descrição ou valor é recusado", async () => {
    const base = { category: "outros" as const, expenseDate: "2026-11-07", sellerId: JOAO, note: "" };
    await expect(saveExpense({ ...base, description: " ", amountCents: 100 })).rejects.toThrow(/Descreva/);
    await expect(saveExpense({ ...base, description: "Gelo", amountCents: 0 })).rejects.toThrow(/valor/);
  });
});

describe("perfil", () => {
  it("foto e cargo sobem; foto pendente não é sobrescrita pelo servidor", async () => {
    await syncAll();
    await updateSellerAvatar(JOAO, "data:image/jpeg;base64,AAAA");
    await updateSellerRole(JOAO, "  Sócio   fundador ");
    await syncAll();
    const remote = fake.rows("sellers").find((s) => s.id === JOAO)!;
    expect(remote).toMatchObject({ avatar_url: "data:image/jpeg;base64,AAAA", role: "Sócio fundador" });
    expect(await getDb().sellers.get(JOAO)).toMatchObject({ avatarDirty: 0, roleDirty: 0 });
  });

  it("cargo vazio ou longo demais é recusado", async () => {
    await syncAll();
    await expect(updateSellerRole(JOAO, "   ")).rejects.toThrow(/cargo/);
    await expect(updateSellerRole(JOAO, "x".repeat(41))).rejects.toThrow(/40/);
  });
});
