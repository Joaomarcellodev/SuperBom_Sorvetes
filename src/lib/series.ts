import { addDays, parseDateStr, toDateStr } from "./format";

/** Um ponto do eixo X do gráfico de colunas. */
export interface Bucket {
  key: string;
  /** rótulo curto do eixo ("06/11", "seg", "14h", "nov") */
  label: string;
  /** rótulo completo do tooltip/tabela ("sexta, 6 de nov.") */
  title: string;
  values: number[];
}

export type Granularity = "hour" | "day" | "month";

const pad = (n: number) => String(n).padStart(2, "0");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dayTitle = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short" });
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const monthTitle = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

/** Escolhe a escala do eixo X pelo tamanho do intervalo. */
export function granularityFor(from: string, to: string): Granularity {
  if (from === to) return "hour";
  const days = Math.round((parseDateStr(to).getTime() - parseDateStr(from).getTime()) / 86_400_000) + 1;
  return days > 62 ? "month" : "day";
}

export interface SeriesItem {
  date: string;
  /** ISO; usado só na escala por hora */
  createdAt?: string;
}

/**
 * Agrupa itens em colunas. `valueOf` devolve um valor por série (ex.: [pacotes] ou [entradas, saídas]).
 * Dias/meses/horas sem movimento entram com zero, para o eixo não "pular".
 */
export function buildBuckets<T extends SeriesItem>(
  items: T[],
  from: string,
  to: string,
  seriesCount: number,
  valueOf: (item: T) => number[],
): { granularity: Granularity; buckets: Bucket[] } {
  const granularity = granularityFor(from, to);
  const map = new Map<string, Bucket>();
  const zero = () => Array.from({ length: seriesCount }, () => 0);

  if (granularity === "hour") {
    const hours = items.map((i) => (i.createdAt ? new Date(i.createdAt).getHours() : 12));
    const first = Math.min(7, ...hours);
    const last = Math.max(18, ...hours);
    for (let h = first; h <= last; h++) map.set(String(h), { key: String(h), label: `${h}h`, title: `${pad(h)}:00 – ${pad(h)}:59`, values: zero() });
    items.forEach((item, idx) => add(map.get(String(hours[idx])), valueOf(item)));
  } else if (granularity === "day") {
    const short = Math.round((parseDateStr(to).getTime() - parseDateStr(from).getTime()) / 86_400_000) < 7;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const date = parseDateStr(d);
      map.set(d, {
        key: d,
        label: short ? weekday.format(date).replace(".", "") : `${d.slice(8)}/${d.slice(5, 7)}`,
        title: capitalize(dayTitle.format(date)),
        values: zero(),
      });
    }
    for (const item of items) add(map.get(item.date), valueOf(item));
  } else {
    const start = parseDateStr(from);
    const end = parseDateStr(to);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      const key = toDateStr(d).slice(0, 7);
      map.set(key, { key, label: monthShort.format(d).replace(".", ""), title: capitalize(monthTitle.format(d)), values: zero() });
    }
    for (const item of items) add(map.get(item.date.slice(0, 7)), valueOf(item));
  }
  return { granularity, buckets: [...map.values()] };
}

function add(bucket: Bucket | undefined, values: number[]) {
  if (!bucket) return;
  values.forEach((v, i) => (bucket.values[i] = (bucket.values[i] ?? 0) + v));
}

/** Teto "redondo" do eixo e os valores das linhas de grade (0, passo, 2×passo...). */
export function niceScale(max: number, targetTicks = 3): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0] };
  const raw = max / targetTicks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return { max: top, ticks };
}
