import type { Chore } from '@/domain/chores';
import { hourLabel, planReminders, REMINDER_WINDOW_DAYS, toReminderSettings } from '@/domain/reminders';

const chore = (id: string, extra: Partial<Chore> = {}): Chore => ({
  id,
  title: `Tarea ${id}`,
  emoji: '🧹',
  assignedTo: null,
  frequency: 'once',
  dueDate: null,
  done: false,
  lastDoneAt: null,
  lastDoneBy: null,
  ...extra,
});

// 8 nov 2026 (domingo) a las 6:00 a. m., hora local.
const NOW = new Date(2026, 10, 8, 6, 0, 0);
const ME = 'yo';
const at8 = { hour: 8 };

describe('reminders', () => {
  it('no programa nada si están apagados', () => {
    expect(planReminders([chore('a', { dueDate: '2026-11-08' })], ME, NOW, { hour: null })).toEqual([]);
  });

  it('avisa las tareas mías o de cualquiera, no las de la pareja ni las hechas o sin fecha', () => {
    const plan = planReminders(
      [
        chore('mia', { dueDate: '2026-11-08', assignedTo: ME }),
        chore('libre', { dueDate: '2026-11-08' }),
        chore('pareja', { dueDate: '2026-11-08', assignedTo: 'otra' }),
        chore('hecha', { dueDate: '2026-11-08', done: true }),
        chore('algun-dia'),
      ],
      ME,
      NOW,
      at8,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].choreIds).toEqual(['libre', 'mia']);
    expect(plan[0].title).toBe('2 tareas para hoy');
    expect(plan[0].at).toEqual(new Date(2026, 10, 8, 8, 0, 0));
  });

  it('una sola tarea va en el título', () => {
    const [reminder] = planReminders([chore('a', { title: 'Sacar la basura', emoji: '🗑️', dueDate: '2026-11-09' })], ME, NOW, at8);
    expect(reminder.day).toBe('2026-11-09');
    expect(reminder.title).toBe('🗑️ Sacar la basura');
  });

  it('las atrasadas se avisan hoy, una vez', () => {
    const plan = planReminders([chore('a', { dueDate: '2026-11-01', frequency: 'daily' })], ME, NOW, at8);
    expect(plan.map(reminder => reminder.day)).toEqual(['2026-11-08']);
  });

  it('repite las tareas recurrentes dentro de la ventana', () => {
    const daily = planReminders([chore('a', { dueDate: '2026-11-08', frequency: 'daily' })], ME, NOW, at8);
    expect(daily).toHaveLength(REMINDER_WINDOW_DAYS);
    const weekly = planReminders(
      [chore('b', { dueDate: '2026-11-09', frequency: 'weekly', weekdays: [1, 4] })],
      ME,
      NOW,
      at8,
    );
    expect(weekly.map(reminder => reminder.day)).toEqual(['2026-11-09', '2026-11-12', '2026-11-16', '2026-11-19']);
  });

  it('no programa avisos de hoy si la hora ya pasó', () => {
    const late = new Date(2026, 10, 8, 9, 30, 0);
    const plan = planReminders([chore('a', { dueDate: '2026-11-08' }), chore('b', { dueDate: '2026-11-10' })], ME, late, at8);
    expect(plan.map(reminder => reminder.day)).toEqual(['2026-11-10']);
  });

  it('resume cuando son muchas', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => chore(id, { dueDate: '2026-11-08' }));
    const [reminder] = planReminders(many, ME, NOW, at8);
    expect(reminder.body).toMatch(/y 2 más$/);
  });

  it('formatea la hora y valida los ajustes guardados', () => {
    expect(hourLabel(7)).toBe('7 a. m.');
    expect(hourLabel(12)).toBe('12 m.');
    expect(hourLabel(18)).toBe('6 p. m.');
    expect(toReminderSettings({ hour: 8 })).toEqual({ hour: 8 });
    expect(toReminderSettings({ hour: 25 })).toEqual({ hour: null });
    expect(toReminderSettings(null)).toEqual({ hour: null });
  });
});
