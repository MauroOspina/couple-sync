import {
  choreHistory,
  completeChore,
  countByMember,
  firstRepeatDate,
  groupChores,
  lastCompletionLog,
  nextDueDate,
  nextMemberId,
  repeatFieldsOf,
  repeatLabel,
  repeatRuleOf,
  sameRepeatRule,
  type Chore,
  type ChoreLog,
  type RepeatRule,
} from '@/domain/chores';

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
  // TODAY (8 nov 2026) es domingo.
  const rule = (unit: RepeatRule['unit'], every = 1, weekdays: number[] = []): RepeatRule => ({ unit, every, weekdays });

  it('calcula la siguiente fecha manteniendo el calendario', () => {
    expect(nextDueDate('2026-11-02', rule('week'), TODAY)).toBe('2026-11-09');
    expect(nextDueDate('2026-11-10', rule('week'), TODAY)).toBe('2026-11-17');
    expect(nextDueDate(null, rule('day'), TODAY)).toBe('2026-11-09');
    expect(nextDueDate('2026-10-31', rule('month'), TODAY)).toBe('2026-11-30');
  });

  it('repite cada N días, semanas, meses o años', () => {
    expect(nextDueDate('2026-11-01', rule('day', 3), TODAY)).toBe('2026-11-10');
    expect(nextDueDate('2026-11-08', rule('week', 2), TODAY)).toBe('2026-11-22');
    expect(nextDueDate('2026-09-15', rule('month', 3), TODAY)).toBe('2026-12-15');
    expect(nextDueDate('2026-02-28', rule('year'), TODAY)).toBe('2027-02-28');
  });

  it('repite en días de la semana, saltando semanas', () => {
    const mondayThursdayEvery2 = rule('week', 2, [1, 4]);
    // Lunes 9 → jueves 12 (misma semana) → lunes 23 (se salta la semana del 16).
    expect(nextDueDate('2026-11-09', mondayThursdayEvery2, '2026-11-09')).toBe('2026-11-12');
    expect(nextDueDate('2026-11-12', mondayThursdayEvery2, '2026-11-12')).toBe('2026-11-23');
    // Cada semana, sábado y domingo: del domingo 8 al sábado 14.
    expect(nextDueDate('2026-11-08', rule('week', 1, [6, 0]), TODAY)).toBe('2026-11-14');
    // Atrasada: avanza hasta pasar hoy sin salirse del calendario.
    expect(nextDueDate('2026-10-26', rule('week', 1, [1]), TODAY)).toBe('2026-11-09');
  });

  it('ajusta la primera fecha al primer día elegido', () => {
    expect(firstRepeatDate('2026-11-10', rule('week', 1, [1, 4]))).toBe('2026-11-12');
    expect(firstRepeatDate('2026-11-12', rule('week', 1, [1, 4]))).toBe('2026-11-12');
    expect(firstRepeatDate('2026-11-10', rule('day', 2))).toBe('2026-11-10');
  });

  it('convierte reglas a columnas y de vuelta (años = meses × 12)', () => {
    expect(repeatFieldsOf(rule('year', 2))).toEqual({ frequency: 'monthly', repeatEvery: 24, weekdays: [] });
    expect(repeatRuleOf({ frequency: 'monthly', repeatEvery: 24 })).toEqual(rule('year', 2));
    expect(repeatRuleOf({ frequency: 'monthly', repeatEvery: 6 })).toEqual(rule('month', 6));
    expect(repeatFieldsOf(rule('week', 1, [4, 1, 4, 9]))).toEqual({ frequency: 'weekly', repeatEvery: 1, weekdays: [1, 4] });
    expect(repeatFieldsOf(rule('day', 500)).repeatEvery).toBe(99);
    expect(repeatFieldsOf(null)).toEqual({ frequency: 'once', repeatEvery: 1, weekdays: [] });
    // Tareas guardadas antes de existir estas columnas.
    expect(repeatRuleOf({ frequency: 'weekly' })).toEqual(rule('week'));
    expect(repeatRuleOf({ frequency: 'once' })).toBeNull();
  });

  it('compara reglas sin importar el orden de los días', () => {
    expect(sameRepeatRule(rule('week', 1, [4, 1]), rule('week', 1, [1, 4]))).toBe(true);
    expect(sameRepeatRule(rule('week'), rule('week', 2))).toBe(false);
    expect(sameRepeatRule(null, null)).toBe(true);
    expect(sameRepeatRule(null, rule('day'))).toBe(false);
  });

  it('describe la repetición', () => {
    expect(repeatLabel(null)).toBe('Una vez');
    expect(repeatLabel(rule('day'))).toBe('Cada día');
    expect(repeatLabel(rule('month', 3))).toBe('Cada 3 meses');
    expect(repeatLabel(rule('year'))).toBe('Cada año');
    expect(repeatLabel(rule('week', 2, [4, 1]))).toBe('Cada 2 semanas: lun, jue');
    expect(repeatLabel(rule('week', 1, [0, 1]))).toBe('Cada semana: lun, dom');
  });

  it('completa tareas de una vez y repetitivas', () => {
    const now = '2026-11-08T12:00:00.000Z';
    const once = completeChore(chore('a', { dueDate: TODAY }), 'user-1', TODAY, now);
    expect(once).toMatchObject({ done: true, lastDoneBy: 'user-1', lastDoneAt: now });

    const weekly = completeChore(chore('b', { frequency: 'weekly', dueDate: TODAY }), 'user-2', TODAY, now);
    expect(weekly).toMatchObject({ done: false, dueDate: '2026-11-15', lastDoneBy: 'user-2' });

    const everyTwoDays = completeChore(chore('c', { frequency: 'daily', repeatEvery: 2, dueDate: TODAY }), 'user-1', TODAY, now);
    expect(everyTwoDays.dueDate).toBe('2026-11-10');
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

  it('encuentra el registro de la última vez que se completó', () => {
    const done = chore('a', { done: true, lastDoneAt: '2026-11-08T12:00:00.000Z' });
    const logs: ChoreLog[] = [
      { id: 'old', choreId: 'a', choreTitle: 'A', doneBy: 'u1', doneAt: '2026-11-01T12:00:00.000Z' },
      // La base de datos devuelve el mismo instante con otro formato.
      { id: 'last', choreId: 'a', choreTitle: 'A', doneBy: 'u1', doneAt: '2026-11-08T12:00:00+00:00' },
      { id: 'other', choreId: 'b', choreTitle: 'B', doneBy: 'u1', doneAt: '2026-11-08T12:00:00.000Z' },
    ];
    expect(lastCompletionLog(done, logs)?.id).toBe('last');
    expect(lastCompletionLog(chore('a'), logs)).toBeUndefined();
  });

  it('arma el historial por día, filtra por persona y corta por partes', () => {
    // Fechas locales para que el día no dependa de la zona horaria de quien corre el test.
    const at = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
    const log = (id: string, doneBy: string | null, doneAt: string): ChoreLog => ({
      id,
      choreId: null,
      choreTitle: id,
      doneBy,
      doneAt,
    });
    const logs = [log('a', 'u1', at(7, 9)), log('b', 'u2', at(8, 20)), log('c', 'u1', at(8, 8)), log('d', null, at(5, 12))];

    const all = choreHistory(logs);
    expect(all.total).toBe(4);
    expect(all.days.map(day => [day.day, day.logs.map(item => item.id)])).toEqual([
      ['2026-11-08', ['b', 'c']],
      ['2026-11-07', ['a']],
      ['2026-11-05', ['d']],
    ]);

    const mine = choreHistory(logs, { doneBy: 'u1' });
    expect(mine.days.flatMap(day => day.logs.map(item => item.id))).toEqual(['c', 'a']);

    const firstPage = choreHistory(logs, { limit: 2 });
    expect(firstPage.total).toBe(4);
    expect(firstPage.days.flatMap(day => day.logs.map(item => item.id))).toEqual(['b', 'c']);
  });

  it('pasa a la siguiente persona en círculo', () => {
    expect(nextMemberId(['u1', 'u2'], 'u1')).toBe('u2');
    expect(nextMemberId(['u1', 'u2'], 'u2')).toBe('u1');
    expect(nextMemberId(['u1', 'u2'], null)).toBe('u1');
    expect(nextMemberId(['u1', 'u2'], 'gone')).toBe('u1');
    expect(nextMemberId([], 'u1')).toBe('u1');
  });
});
