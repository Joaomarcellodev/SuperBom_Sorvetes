/**
 * Supabase falso, em memória, só com o que o app usa:
 *   from(t).upsert(rows) · from(t).select(cols).order().gte().range() · from(t).update(patch).eq() · rpc()
 * Serve para testar a sincronização sem tocar no banco de verdade.
 *
 * `missingColumns` simula uma migração que ainda não rodou (o PostgREST responde PGRST204).
 * `readOnlyColumns` simula coluna sem permissão de escrita (responde 42501).
 */
type Row = Record<string, unknown>;
type Result<T = unknown> = { data: T; error: { message: string; code?: string } | null };

const KEYS: Record<string, string> = { product_prices: "product_id" };
const TIMESTAMPED = new Set(["routes", "route_points", "sales", "expenses", "product_prices"]);

export interface FakeOptions {
  missingColumns?: Record<string, string[]>;
  readOnlyColumns?: Record<string, string[]>;
}

export function createFakeSupabase(options: FakeOptions = {}) {
  const tables = new Map<string, Row[]>();
  let clock = Date.parse("2026-11-07T12:00:00Z");
  const now = () => new Date((clock += 1000)).toISOString();
  const rpcs = new Map<string, (args: Row) => Result>();

  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  };
  const keyOf = (name: string) => KEYS[name] ?? "id";

  const schemaError = (name: string, rows: Row[]) => {
    const missing = options.missingColumns?.[name] ?? [];
    for (const r of rows) for (const col of Object.keys(r)) if (missing.includes(col)) {
      return { message: `Could not find the '${col}' column of '${name}' in the schema cache`, code: "PGRST204" };
    }
    const ro = options.readOnlyColumns?.[name] ?? [];
    for (const r of rows) for (const col of Object.keys(r)) if (ro.includes(col)) {
      return { message: `permission denied for table ${name}`, code: "42501" };
    }
    return null;
  };

  const thenable = <T>(run: () => Result<T>) => ({
    then: (resolve: (r: Result<T>) => unknown, reject?: (e: unknown) => unknown) => {
      try {
        return Promise.resolve(run()).then(resolve, reject);
      } catch (e) {
        return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
      }
    },
  });

  const client = {
    from(name: string) {
      return {
        upsert(input: Row | Row[]) {
          const rows = Array.isArray(input) ? input : [input];
          return thenable(() => {
            const error = schemaError(name, rows);
            if (error) return { data: null, error };
            const list = table(name);
            const key = keyOf(name);
            for (const r of rows) {
              const i = list.findIndex((x) => x[key] === r[key]);
              const merged = { ...(i >= 0 ? list[i] : {}), ...r, ...(TIMESTAMPED.has(name) ? { updated_at: now() } : {}) };
              if (i >= 0) list[i] = merged;
              else list.push(merged);
            }
            return { data: null, error: null };
          });
        },
        update(patch: Row) {
          return {
            eq(col: string, value: unknown) {
              return thenable(() => {
                const error = schemaError(name, [patch]);
                if (error) return { data: null, error };
                for (const r of table(name)) if (r[col] === value) Object.assign(r, patch);
                return { data: null, error: null };
              });
            },
          };
        },
        select(cols = "*") {
          const filters: Array<(r: Row) => boolean> = [];
          const orders: string[] = [];
          let range: [number, number] | null = null;
          const run = (): Result<Row[]> => {
            if (cols !== "*") {
              const error = schemaError(name, [Object.fromEntries(cols.split(",").map((c) => [c.trim(), true]))]);
              if (error) return { data: [], error };
            }
            let rows = table(name).filter((r) => filters.every((f) => f(r)));
            for (const col of [...orders].reverse()) rows = [...rows].sort((a, b) => String(a[col]).localeCompare(String(b[col])));
            if (range) rows = rows.slice(range[0], range[1] + 1);
            // devolve cópias, como a rede faria
            const picked = rows.map((r) =>
              cols === "*" ? { ...r } : Object.fromEntries(cols.split(",").map((c) => [c.trim(), r[c.trim()]])),
            );
            return { data: structuredClone(picked), error: null };
          };
          const builder = {
            order(col: string) {
              orders.push(col);
              return builder;
            },
            gte(col: string, value: string) {
              filters.push((r) => String(r[col]) >= value);
              return builder;
            },
            eq(col: string, value: unknown) {
              filters.push((r) => r[col] === value);
              return builder;
            },
            range(from: number, to: number) {
              range = [from, to];
              return thenable(run);
            },
            then: (resolve: (r: Result<Row[]>) => unknown, reject?: (e: unknown) => unknown) => thenable(run).then(resolve, reject),
          };
          return builder;
        },
      };
    },
    rpc(fn: string, args: Row) {
      return thenable(() => {
        const impl = rpcs.get(fn);
        if (!impl) return { data: null, error: { message: `Could not find the function public.${fn} in the schema cache`, code: "PGRST202" } };
        return impl(args);
      });
    },
  };

  return {
    client,
    tables,
    /** linhas de uma tabela (para conferir o que "chegou ao servidor") */
    rows: (name: string) => table(name),
    /** grava direto no "servidor", como se o sócio tivesse sincronizado */
    seed: (name: string, rows: Row[]) => {
      for (const r of rows) table(name).push({ ...(TIMESTAMPED.has(name) ? { updated_at: now() } : {}), ...r });
    },
    defineRpc: (fn: string, impl: (args: Row) => Result) => rpcs.set(fn, impl),
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
