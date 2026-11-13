/** Fecha de calendario local en formato 'YYYY-MM-DD'. Se compara bien como texto. */
export type ISODate = string;

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Suma meses sin desbordar: 31 ene + 1 mes → 28/29 feb. */
export function addMonths(value: ISODate, months: number): ISODate {
  const date = parseISODate(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toISODate(date);
}

export function diffInDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

/** Texto corto para una fecha límite: "Hoy", "Mañana", "Atrasada 3 días", "Jueves", "14 nov". */
export function formatDueLabel(due: ISODate, today: ISODate): string {
  const diff = diffInDays(today, due);
  if (diff < -1) return `Atrasada ${-diff} días`;
  if (diff === -1) return 'Atrasada desde ayer';
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  const date = parseISODate(due);
  if (diff < 7) return WEEKDAYS[date.getDay()];
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Inicio del mes actual como ISO completo, para filtrar registros por `timestamptz`. */
export function startOfMonthISO(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Encabezado de un día pasado: "Hoy", "Ayer", "Lunes 10 nov" (con año si no es el actual). */
export function formatDayLabel(day: ISODate, today: ISODate): string {
  const diff = diffInDays(day, today);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const date = parseISODate(day);
  const label = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return day.slice(0, 4) === today.slice(0, 4) ? label : `${label} ${date.getFullYear()}`;
}

/** Hora local corta: "8:05 a. m.", "12:30 p. m.". */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}
