import {
  formatMoney,
  formatPurchaseDate,
  groupPurchasesByMonth,
  parseAmount,
  summarizeItems,
  type Purchase,
} from '@/domain/purchases';

// Fechas a mediodía local para que la zona horaria no cambie el día ni el mes.
const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).toISOString();
const purchase = (id: string, boughtAt: string, total: number | null, items: string[] = ['Leche']): Purchase => ({
  id,
  boughtAt,
  total,
  items,
});

describe('purchases', () => {
  it('lee montos como los escribe la gente', () => {
    expect(parseAmount('185.000')).toBe(185000);
    expect(parseAmount('$ 185,000')).toBe(185000);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('0')).toBeNull();
  });

  it('muestra pesos con punto de miles', () => {
    expect(formatMoney(185000)).toBe('$185.000');
    expect(formatMoney(1234567)).toBe('$1.234.567');
    expect(formatMoney(950)).toBe('$950');
  });

  it('muestra la fecha corta, con año solo si no es el actual', () => {
    const now = new Date(2026, 10, 19);
    expect(formatPurchaseDate(at(2026, 11, 18), now)).toBe('18 nov');
    expect(formatPurchaseDate(at(2025, 12, 24), now)).toBe('24 dic 2025');
  });

  it('resume los productos', () => {
    expect(summarizeItems(['Leche', 'Pan'])).toBe('Leche, Pan');
    expect(summarizeItems(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C +2');
  });

  it('agrupa por mes, del más reciente, sumando solo los totales anotados', () => {
    const months = groupPurchasesByMonth([
      purchase('1', at(2026, 10, 30), 100000),
      purchase('2', at(2026, 11, 10), 227000),
      purchase('3', at(2026, 11, 18), 185000),
      purchase('4', at(2026, 11, 5), null),
    ]);
    expect(months.map(month => [month.label, month.total, month.purchases.map(item => item.id)])).toEqual([
      ['Noviembre 2026', 412000, ['3', '2', '4']],
      ['Octubre 2026', 100000, ['1']],
    ]);
  });
});
