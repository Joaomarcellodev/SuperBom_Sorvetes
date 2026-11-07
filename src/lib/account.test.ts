import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { changePin, checkCurrentPin } from "./account";
import { getDb } from "./db";
import { hashPin, verifyPin } from "./pin";

const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("./supabase", () => ({ getSupabase: () => holder.client, isSupabaseConfigured: true }));

const ID = "11111111-1111-1111-1111-111111111111";

beforeEach(async () => {
  const db = getDb();
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.sellers.put({ id: ID, name: "João", role: "Sócio", pinHash: await hashPin("4821") });
  const fake = createFakeSupabase();
  // imita a função change_seller_pin da migração 0006
  let serverHash = await hashPin("4821");
  fake.defineRpc("change_seller_pin", (args) => {
    // (síncrono no fake: compara com o hash pré-calculado do PIN atual certo)
    const ok = args.p_current_pin === "4821" && serverHash !== "";
    if (ok) serverHash = "changed";
    return { data: ok, error: null };
  });
  holder.client = fake.client;
});

describe("trocar PIN", () => {
  it("confere o PIN atual no aparelho", async () => {
    expect(await checkCurrentPin(ID, "4821")).toBe(true);
    expect(await checkCurrentPin(ID, "0000")).toBe(false);
  });
  it("troca e o PIN novo já vale neste aparelho", async () => {
    await changePin(ID, "4821", "1357");
    const s = await getDb().sellers.get(ID);
    expect(await verifyPin("1357", s!.pinHash)).toBe(true);
    expect(await verifyPin("4821", s!.pinHash)).toBe(false);
  });
  it("recusa PIN atual errado, PIN novo inválido ou igual", async () => {
    await expect(changePin(ID, "0000", "1357")).rejects.toThrow(/atual incorreto/);
    await expect(changePin(ID, "4821", "12a4")).rejects.toThrow(/4 dígitos/);
    await expect(changePin(ID, "4821", "4821")).rejects.toThrow(/diferente/);
  });
  it("sem a migração 0006 explica o que fazer", async () => {
    holder.client = createFakeSupabase().client; // sem a função
    await expect(changePin(ID, "4821", "1357")).rejects.toThrow(/0006_change_pin/);
    const s = await getDb().sellers.get(ID);
    expect(await verifyPin("4821", s!.pinHash)).toBe(true); // nada mudou
  });
});
