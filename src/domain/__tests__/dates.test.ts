import { addDays, addMonths, diffInDays, formatDueLabel } from '@/domain/dates';

describe('dates', () => {
  it('suma días cruzando meses', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('suma meses sin desbordar el fin de mes', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('calcula diferencias en días', () => {
    expect(diffInDays('2026-11-08', '2026-11-10')).toBe(2);
    expect(diffInDays('2026-11-10', '2026-11-08')).toBe(-2);
  });

  it('formatea fechas límite', () => {
    const today = '2026-11-08';
    expect(formatDueLabel('2026-11-08', today)).toBe('Hoy');
    expect(formatDueLabel('2026-11-09', today)).toBe('Mañana');
    expect(formatDueLabel('2026-11-07', today)).toBe('Atrasada desde ayer');
    expect(formatDueLabel('2026-11-05', today)).toBe('Atrasada 3 días');
    expect(formatDueLabel('2026-11-12', today)).toBe('Jueves');
    expect(formatDueLabel('2026-11-20', today)).toBe('20 nov');
  });
});
