import { nextDueDate, repeatRuleOf, type Chore } from '@/domain/chores';
import { addDays, parseISODate, toISODate, type ISODate } from '@/domain/dates';

/** Ajustes de recordatorios de este teléfono. `hour = null` = apagados. */
export interface ReminderSettings {
  hour: number | null;
}

/** Horas que se ofrecen (formato 24 h). */
export const REMINDER_HOURS = [7, 8, 9, 12, 18, 20];

/** Días hacia adelante que se programan. Se reprograma cada vez que se abre la app o cambian las tareas. */
export const REMINDER_WINDOW_DAYS = 14;

const MAX_ITEMS_IN_BODY = 4;

export interface PlannedReminder {
  day: ISODate;
  /** Momento exacto del aviso (hora local). */
  at: Date;
  title: string;
  body: string;
  choreIds: string[];
}

/** "7 a. m.", "12 m.", "6 p. m.": como se dice la hora en Colombia. */
export function hourLabel(hour: number): string {
  if (hour === 0) return '12 a. m.';
  if (hour === 12) return '12 m.';
  return hour < 12 ? `${hour} a. m.` : `${hour - 12} p. m.`;
}

export function toReminderSettings(value: unknown): ReminderSettings {
  const hour = (value as { hour?: unknown } | null)?.hour;
  return { hour: typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null };
}

/** Días (dentro de la ventana) en que le toca la tarea, suponiendo que se hace a tiempo. Las atrasadas cuentan para hoy. */
function occurrences(chore: Chore, today: ISODate, lastDay: ISODate): ISODate[] {
  if (chore.done || !chore.dueDate) return [];
  const first = chore.dueDate < today ? today : chore.dueDate;
  if (first > lastDay) return [];
  const days = [first];
  const rule = repeatRuleOf(chore);
  if (!rule || chore.dueDate < today) return days;
  let next = nextDueDate(chore.dueDate, rule, chore.dueDate);
  while (next <= lastDay && days.length <= REMINDER_WINDOW_DAYS) {
    days.push(next);
    next = nextDueDate(next, rule, next);
  }
  return days;
}

function reminderText(chores: Chore[]): Pick<PlannedReminder, 'title' | 'body'> {
  if (chores.length === 1) {
    const [chore] = chores;
    return { title: `${chore.emoji} ${chore.title}`, body: 'Hoy te toca. Toca para verla en Nest.' };
  }
  const shown = chores.slice(0, MAX_ITEMS_IN_BODY).map(chore => `${chore.emoji} ${chore.title}`);
  const rest = chores.length - shown.length;
  return {
    title: `${chores.length} tareas para hoy`,
    body: rest > 0 ? `${shown.join(', ')} y ${rest} más` : shown.join(', '),
  };
}

/**
 * Un aviso por día con las tareas que me tocan (asignadas a mí o a cualquiera), a la hora elegida,
 * durante los próximos días. Las que ya pasaron de hora hoy no se programan.
 */
export function planReminders(chores: Chore[], userId: string | null, now: Date, settings: ReminderSettings): PlannedReminder[] {
  const { hour } = settings;
  if (hour === null) return [];
  const today = toISODate(now);
  const lastDay = addDays(today, REMINDER_WINDOW_DAYS - 1);

  const byDay = new Map<ISODate, Chore[]>();
  for (const chore of chores) {
    if (chore.assignedTo !== null && chore.assignedTo !== userId) continue;
    for (const day of occurrences(chore, today, lastDay)) {
      byDay.set(day, [...(byDay.get(day) ?? []), chore]);
    }
  }

  return [...byDay.keys()]
    .sort()
    .map(day => {
      const at = parseISODate(day);
      at.setHours(hour, 0, 0, 0);
      const dayChores = (byDay.get(day) ?? []).sort((a, b) => a.title.localeCompare(b.title, 'es'));
      return { day, at, ...reminderText(dayChores), choreIds: dayChores.map(chore => chore.id) };
    })
    .filter(reminder => reminder.at.getTime() > now.getTime());
}
