const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD no fuso do aparelho (não usar toISOString: ele converte para UTC). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayStr = (): string => toDateStr(new Date());

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function parseDateStr(dateStr: string): Date {
  const [y = 1970, m = 1, d = 1] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Segunda-feira da semana de `dateStr`. */
export function startOfWeek(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return toDateStr(d);
}

export const startOfMonth = (dateStr: string): string => `${dateStr.slice(0, 7)}-01`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Sexta-feira, 6 de novembro" */
export function formatLongDate(dateStr: string): string {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(
      parseDateStr(dateStr),
    ),
  );
}

/** "Hoje", "Ontem" ou "qui., 5 de nov." */
export function formatDayLabel(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return "Hoje";
  if (dateStr === addDays(today, -1)) return "Ontem";
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short" }).format(
      parseDateStr(dateStr),
    ),
  );
}

/** "06/11/2026" */
export const formatShortDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** "Há 25 min", "Há 2 horas", "Ontem às 14:30" */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffMin = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `Há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.round(hours / 24);
  return `Há ${days} ${days === 1 ? "dia" : "dias"}`;
}

/** "Hoje às 14:30" / "05/11 às 09:12" */
export function formatSyncMoment(iso: string): string {
  const d = new Date(iso);
  const day = toDateStr(d);
  const time = formatTime(iso);
  if (day === todayStr()) return `Hoje às ${time}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${time}`;
}

export const formatInt = (n: number): string => new Intl.NumberFormat("pt-BR").format(n);

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");
