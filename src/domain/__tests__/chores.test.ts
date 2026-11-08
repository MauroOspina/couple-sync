import { completeChore, countByMember, groupChores, nextDueDate, type Chore } from '@/domain/chores';

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

const TODAY = '2026-11-08';

describe('chores', () => {
  it('calcula la siguiente fecha manteniendo el calendario', () => {
    expect(nextDueDate('2026-11-02', 'weekly', TODAY)).toBe('2026-11-09');
    expect(nextDueDate('2026-11-10', 'weekly', TODAY)).toBe('2026-11-17');
    expect(nextDueDate(null, 'daily', TODAY)).toBe('2026-11-09');
    expect(nextDueDate('2026-10-31', 'monthly', TODAY)).toBe('2026-11-30');
  });

  it('completa tareas de una vez y repetitivas', () => {
    const now = '2026-11-08T12:00:00.000Z';
    const once = completeChore(chore('a', { dueDate: TODAY }), 'user-1', TODAY, now);
    expect(once).toMatchObject({ done: true, lastDoneBy: 'user-1', lastDoneAt: now });

    const weekly = completeChore(chore('b', { frequency: 'weekly', dueDate: TODAY }), 'user-2', TODAY, now);
    expect(weekly).toMatchObject({ done: false, dueDate: '2026-11-15', lastDoneBy: 'user-2' });
  });

  it('agrupa por secciones', () => {
    const groups = groupChores(
      [
        chore('late', { dueDate: '2026-11-06' }),
        chore('today', { dueDate: TODAY }),
        chore('next', { dueDate: '2026-11-10' }),
        chore('someday'),
        chore('done', { done: true, lastDoneAt: '2026-11-07T10:00:00.000Z' }),
      ],
      TODAY,
    );
    expect(groups.today.map(item => item.id)).toEqual(['late', 'today']);
    expect(groups.upcoming.map(item => item.id)).toEqual(['next']);
    expect(groups.someday.map(item => item.id)).toEqual(['someday']);
    expect(groups.done.map(item => item.id)).toEqual(['done']);
  });

  it('cuenta tareas por persona desde una fecha', () => {
    const logs = [
      { id: '1', choreId: null, choreTitle: 'A', doneBy: 'u1', doneAt: '2026-11-02T10:00:00.000Z' },
      { id: '2', choreId: null, choreTitle: 'B', doneBy: 'u1', doneAt: '2026-11-03T10:00:00.000Z' },
      { id: '3', choreId: null, choreTitle: 'C', doneBy: 'u2', doneAt: '2026-11-04T10:00:00.000Z' },
      { id: '4', choreId: null, choreTitle: 'D', doneBy: 'u2', doneAt: '2026-10-20T10:00:00.000Z' },
      { id: '5', choreId: null, choreTitle: 'E', doneBy: null, doneAt: '2026-11-05T10:00:00.000Z' },
    ];
    expect(countByMember(logs, '2026-11-01T00:00:00.000Z')).toEqual({ u1: 2, u2: 1 });
  });
});
