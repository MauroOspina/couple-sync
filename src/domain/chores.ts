import type { SyncedItem } from '@/domain/collection';
import { addDays, addMonths, type ISODate } from '@/domain/dates';

export type ChoreFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Chore extends SyncedItem {
  title: string;
  emoji: string;
  /** Usuario responsable, o `null` = cualquiera de los dos. */
  assignedTo: string | null;
  frequency: ChoreFrequency;
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

export const FREQUENCY_LABELS: Record<ChoreFrequency, string> = {
  once: 'Una vez',
  daily: 'Cada día',
  weekly: 'Cada semana',
  monthly: 'Cada mes',
};

export const CHORE_EMOJIS = ['🧹', '🧽', '🧺', '🍽️', '🗑️', '🛏️', '🚿', '🪴', '🐾', '🛒', '🧾', '🔧'];

export function toChoreFrequency(value: unknown): ChoreFrequency {
  return value === 'daily' || value === 'weekly' || value === 'monthly' ? value : 'once';
}

/** Siguiente fecha de una tarea repetitiva, siempre posterior a hoy y anclada a su calendario. */
export function nextDueDate(dueDate: ISODate | null, frequency: Exclude<ChoreFrequency, 'once'>, today: ISODate): ISODate {
  const step = (date: ISODate) =>
    frequency === 'daily' ? addDays(date, 1) : frequency === 'weekly' ? addDays(date, 7) : addMonths(date, 1);
  let next = step(dueDate ?? today);
  while (next <= today) next = step(next);
  return next;
}

export function completeChore(chore: Chore, userId: string | null, today: ISODate, nowIso: string): Chore {
  const done = { ...chore, lastDoneAt: nowIso, lastDoneBy: userId };
  if (chore.frequency === 'once') return { ...done, done: true };
  return { ...done, done: false, dueDate: nextDueDate(chore.dueDate, chore.frequency, today) };
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
