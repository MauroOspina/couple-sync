import type { SyncedItem } from '@/domain/collection';
import { addDays, addMonths, diffInDays, parseISODate, toISODate, type ISODate } from '@/domain/dates';

export type ChoreFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Chore extends SyncedItem {
  title: string;
  emoji: string;
  /** Usuario responsable, o `null` = cualquiera de los dos. */
  assignedTo: string | null;
  frequency: ChoreFrequency;
  /** Cada cuántas unidades se repite (2 = cada 2 semanas). Los años se guardan como 12 meses. Falta en cachés viejas. */
  repeatEvery?: number;
  /** Días de la semana (0 = domingo) para las semanales. Vacío = el mismo día de la fecha. */
  weekdays?: number[];
  dueDate: ISODate | null;
  /** Solo aplica a tareas de una vez. Las repetitivas nunca quedan "hechas": avanzan de fecha. */
  done: boolean;
  lastDoneAt: string | null;
  lastDoneBy: string | null;
}

/** Registro de una tarea completada (para las estadísticas del mes). */
export interface ChoreLog extends SyncedItem {
  choreId: string | null;
  choreTitle: string;
  doneBy: string | null;
  doneAt: string;
}

/** Días de historial que se descargan y se guardan en el teléfono. */
export const CHORE_LOG_WINDOW_DAYS = 90;

export const CHORE_EMOJIS = ['🧹', '🧽', '🧺', '🍽️', '🗑️', '🛏️', '🚿', '🪴', '🐾', '🛒', '🧾', '🔧'];

export function toChoreFrequency(value: unknown): ChoreFrequency {
  return value === 'daily' || value === 'weekly' || value === 'monthly' ? value : 'once';
}

export type RepeatUnit = 'day' | 'week' | 'month' | 'year';

/** Cómo se repite una tarea, en los términos que ve la persona ("cada 2 semanas, lunes y jueves"). */
export interface RepeatRule {
  unit: RepeatUnit;
  every: number;
  /** Días de la semana (0 = domingo). Solo para semanas; vacío = el mismo día de la fecha. */
  weekdays: number[];
}

export type RepeatFields = Pick<Chore, 'frequency' | 'repeatEvery' | 'weekdays'>;

export const MAX_REPEAT_EVERY: Record<RepeatUnit, number> = { day: 99, week: 52, month: 24, year: 10 };

/** Orden en que se muestran los días: lunes primero. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const UNIT_NAMES: Record<RepeatUnit, [string, string]> = {
  day: ['día', 'días'],
  week: ['semana', 'semanas'],
  month: ['mes', 'meses'],
  year: ['año', 'años'],
};

export function unitName(unit: RepeatUnit, every: number): string {
  return UNIT_NAMES[unit][every === 1 ? 0 : 1];
}

function clampEvery(value: number, unit: RepeatUnit): number {
  return Number.isInteger(value) ? Math.min(Math.max(value, 1), MAX_REPEAT_EVERY[unit]) : 1;
}

function cleanWeekdays(weekdays: number[]): number[] {
  return [...new Set(weekdays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
}

/** Regla de repetición de una tarea, o `null` si es de una vez. */
export function repeatRuleOf(chore: RepeatFields): RepeatRule | null {
  const every = chore.repeatEvery ?? 1;
  switch (chore.frequency) {
    case 'once':
      return null;
    case 'daily':
      return { unit: 'day', every: clampEvery(every, 'day'), weekdays: [] };
    case 'weekly':
      return { unit: 'week', every: clampEvery(every, 'week'), weekdays: cleanWeekdays(chore.weekdays ?? []) };
    case 'monthly':
      return every % 12 === 0
        ? { unit: 'year', every: clampEvery(every / 12, 'year'), weekdays: [] }
        : { unit: 'month', every: clampEvery(every, 'month'), weekdays: [] };
  }
}

/** Lo que se guarda en la base de datos para una regla. Los años van como meses × 12. */
export function repeatFieldsOf(rule: RepeatRule | null): Required<RepeatFields> {
  if (!rule) return { frequency: 'once', repeatEvery: 1, weekdays: [] };
  const every = clampEvery(rule.every, rule.unit);
  switch (rule.unit) {
    case 'day':
      return { frequency: 'daily', repeatEvery: every, weekdays: [] };
    case 'week':
      return { frequency: 'weekly', repeatEvery: every, weekdays: cleanWeekdays(rule.weekdays) };
    case 'month':
      return { frequency: 'monthly', repeatEvery: every, weekdays: [] };
    case 'year':
      return { frequency: 'monthly', repeatEvery: every * 12, weekdays: [] };
  }
}

export function sameRepeatRule(a: RepeatRule | null, b: RepeatRule | null): boolean {
  if (a === null || b === null) return a === b;
  const daysA = cleanWeekdays(a.weekdays);
  const daysB = cleanWeekdays(b.weekdays);
  return (
    a.unit === b.unit && a.every === b.every && daysA.length === daysB.length && daysA.every((day, i) => day === daysB[i])
  );
}

/** "Cada día", "Cada 2 semanas: lun, jue", "Cada 3 meses", "Cada año"... */
export function repeatLabel(rule: RepeatRule | null): string {
  if (!rule) return 'Una vez';
  const base = rule.every === 1 ? `Cada ${unitName(rule.unit, 1)}` : `Cada ${rule.every} ${unitName(rule.unit, rule.every)}`;
  if (rule.unit !== 'week' || rule.weekdays.length === 0) return base;
  const days = WEEKDAY_ORDER.filter(day => rule.weekdays.includes(day)).map(day => WEEKDAY_SHORT[day]);
  return `${base}: ${days.join(', ')}`;
}

const weekdayOf = (date: ISODate) => parseISODate(date).getDay();
/** Número de semana (de lunes a domingo) contado desde un lunes fijo. */
const weekIndex = (date: ISODate) => Math.floor(diffInDays('2024-01-01', date) / 7);

/** Siguiente día elegido después de `from`, saltando semanas según `every` (contadas desde la de `from`). */
function nextWeekdayDate(from: ISODate, every: number, weekdays: number[]): ISODate {
  const anchor = weekIndex(from);
  for (let offset = 1; offset <= 7 * (every + 1); offset++) {
    const date = addDays(from, offset);
    if (weekdays.includes(weekdayOf(date)) && (weekIndex(date) - anchor) % every === 0) return date;
  }
  return addDays(from, 7 * every);
}

function stepDate(date: ISODate, rule: RepeatRule): ISODate {
  switch (rule.unit) {
    case 'day':
      return addDays(date, rule.every);
    case 'week':
      return rule.weekdays.length ? nextWeekdayDate(date, rule.every, rule.weekdays) : addDays(date, 7 * rule.every);
    case 'month':
      return addMonths(date, rule.every);
    case 'year':
      return addMonths(date, 12 * rule.every);
  }
}

/** Siguiente fecha de una tarea repetitiva, siempre posterior a hoy y anclada a su calendario. */
export function nextDueDate(dueDate: ISODate | null, rule: RepeatRule, today: ISODate): ISODate {
  let next = stepDate(dueDate ?? today, rule);
  while (next <= today) next = stepDate(next, rule);
  return next;
}

/** Primera fecha válida desde `date`: si la regla pide ciertos días de la semana, salta al primero de ellos. */
export function firstRepeatDate(date: ISODate, rule: RepeatRule | null): ISODate {
  if (!rule || rule.unit !== 'week' || rule.weekdays.length === 0) return date;
  for (let offset = 0; offset < 7; offset++) {
    const candidate = addDays(date, offset);
    if (rule.weekdays.includes(weekdayOf(candidate))) return candidate;
  }
  return date;
}

export function completeChore(chore: Chore, userId: string | null, today: ISODate, nowIso: string): Chore {
  const done = { ...chore, lastDoneAt: nowIso, lastDoneBy: userId };
  const rule = repeatRuleOf(chore);
  if (!rule) return { ...done, done: true };
  return { ...done, done: false, dueDate: nextDueDate(chore.dueDate, rule, today) };
}

export function isDue(chore: Chore, today: ISODate): boolean {
  return !chore.done && chore.dueDate !== null && chore.dueDate <= today;
}

export interface ChoreSections {
  today: Chore[];
  upcoming: Chore[];
  someday: Chore[];
  done: Chore[];
}

export function groupChores(chores: Chore[], today: ISODate): ChoreSections {
  const byDue = (a: Chore, b: Chore) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.title.localeCompare(b.title, 'es');
  const pending = chores.filter(chore => !chore.done);
  return {
    today: pending.filter(chore => isDue(chore, today)).sort(byDue),
    upcoming: pending.filter(chore => chore.dueDate !== null && chore.dueDate > today).sort(byDue),
    someday: pending.filter(chore => chore.dueDate === null).sort((a, b) => a.title.localeCompare(b.title, 'es')),
    done: chores
      .filter(chore => chore.done)
      .sort((a, b) => (b.lastDoneAt ?? '').localeCompare(a.lastDoneAt ?? '')),
  };
}

/** Cuántas tareas completó cada persona desde `sinceIso`. */
export function countByMember(logs: ChoreLog[], sinceIso: string): Record<string, number> {
  const since = Date.parse(sinceIso);
  const counts: Record<string, number> = {};
  for (const log of logs) {
    if (!log.doneBy || Date.parse(log.doneAt) < since) continue;
    counts[log.doneBy] = (counts[log.doneBy] ?? 0) + 1;
  }
  return counts;
}

/** Mismo instante aunque el formato cambie al pasar por la base de datos ('Z' vs '+00:00'). */
function sameInstant(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && Date.parse(a) === Date.parse(b);
}

/** Registro que dejó la última vez que se completó la tarea, si está entre `logs`. */
export function lastCompletionLog(chore: Chore, logs: ChoreLog[]): ChoreLog | undefined {
  return logs.find(log => log.choreId === chore.id && sameInstant(log.doneAt, chore.lastDoneAt));
}

export interface HistoryDay {
  day: ISODate;
  logs: ChoreLog[];
}

export interface ChoreHistory {
  days: HistoryDay[];
  /** Registros que cumplen el filtro (aunque `limit` deje ver menos). */
  total: number;
}

/**
 * Historial de tareas hechas, agrupado por día local, de lo más reciente a lo más antiguo.
 * `doneBy` filtra por persona (`undefined` = todas); `limit` corta la lista para mostrarla por partes.
 */
export function choreHistory(logs: ChoreLog[], options: { doneBy?: string | null; limit?: number } = {}): ChoreHistory {
  const { doneBy, limit = Infinity } = options;
  const matching = logs
    .filter(log => doneBy === undefined || log.doneBy === doneBy)
    .sort((a, b) => Date.parse(b.doneAt) - Date.parse(a.doneAt));
  const days: HistoryDay[] = [];
  for (const log of matching.slice(0, limit)) {
    const day = toISODate(new Date(log.doneAt));
    const last = days[days.length - 1];
    if (last?.day === day) last.logs.push(log);
    else days.push({ day, logs: [log] });
  }
  return { days, total: matching.length };
}

/** Siguiente persona de la lista, para cambiar con un toque quién hizo una tarea. */
export function nextMemberId(memberIds: string[], current: string | null): string | null {
  if (memberIds.length === 0) return current;
  const index = current === null ? -1 : memberIds.indexOf(current);
  return memberIds[(index + 1) % memberIds.length];
}
