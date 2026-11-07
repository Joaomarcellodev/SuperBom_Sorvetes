import { getDb } from "./db";
import { hashPin, verifyPin } from "./pin";
import { getSupabase } from "./supabase";

export const PIN_LENGTH = 4;

/** Confere o PIN atual com o guardado neste aparelho (primeiro passo da troca, funciona offline). */
export async function checkCurrentPin(sellerId: string, pin: string): Promise<boolean> {
  const seller = await getDb().sellers.get(sellerId);
  return Boolean(seller && (await verifyPin(pin, seller.pinHash)));
}

/**
 * Troca o PIN do sócio. Precisa de internet: o servidor confere o PIN atual
 * (função change_seller_pin, migração 0006) e o PIN novo chega ao aparelho do sócio na sincronização.
 * Neste aparelho o PIN novo já vale na hora, inclusive offline.
 */
export async function changePin(sellerId: string, currentPin: string, newPin: string): Promise<void> {
  if (!/^\d{4}$/.test(newPin)) throw new Error("O novo PIN precisa ter 4 dígitos.");
  if (newPin === currentPin) throw new Error("O novo PIN precisa ser diferente do atual.");

  const db = getDb();
  const seller = await db.sellers.get(sellerId);
  if (!seller) throw new Error("Perfil não encontrado neste aparelho.");
  // Confere primeiro aqui: resposta rápida para PIN atual errado.
  if (!(await verifyPin(currentPin, seller.pinHash))) throw new Error("PIN atual incorreto.");

  const sb = getSupabase();
  if (!sb) throw new Error("Supabase não configurado.");
  // Só considera offline quando o navegador diz isso com certeza (onLine === false).
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("Sem internet. Conecte-se para trocar o PIN.");

  const { data, error } = await sb.rpc("change_seller_pin", {
    p_seller_id: sellerId,
    p_current_pin: currentPin,
    p_new_pin: newPin,
  });
  if (error) {
    if (/change_seller_pin|schema cache|PGRST202/i.test(error.message + (error.code ?? ""))) {
      throw new Error("Banco desatualizado: rode supabase/migrations/0006_change_pin.sql no SQL Editor do Supabase.");
    }
    throw new Error(error.message);
  }
  // false = o servidor tem outro PIN (ex.: trocado no outro aparelho e ainda não sincronizado aqui).
  if (data !== true) throw new Error("O PIN atual não confere com o do servidor. Sincronize e tente de novo.");

  await db.sellers.update(sellerId, { pinHash: await hashPin(newPin) });
}
