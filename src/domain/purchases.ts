import type { SyncedItem } from '@/domain/collection';

/** Un mercado terminado: qué se compró, cuándo y, si la persona lo anotó, cuánto costó. */
export interface Purchase extends SyncedItem {
  /** ISO completo del momento en que se terminó el mercado. */
  boughtAt: string;
  /** Total en pesos. null si no lo anotaron. */
  total: number | null;
  items: string[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Lo que escribe la persona ("185.000", "$ 185,000") a pesos. Vacío o sin números → null. */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  const value = Number(digits.slice(0, 12));
  return value > 0 ? value : null;
}

/** "$185.000" (pesos, sin decimales, punto de miles). */
export function formatMoney(value: number): string {
  const rounded = Math.round(value);
  return `$${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** "18 nov" (con año si no es el actual). */
export function formatPurchaseDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const label = `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()}`;
}

/** "Leche, Huevos, Pan +9". */
export function summarizeItems(items: string[], max = 3): string {
  if (items.length <= max) return items.join(', ');
  return `${items.slice(0, max).join(', ')} +${items.length - max}`;
}

export interface PurchaseMonth {
  /** "2026-11" */
  key: string;
  /** "Noviembre 2026" */
  label: string;
  /** Suma de los mercados con total anotado. */
  total: number;
  purchases: Purchase[];
}

/** Agrupa por mes (hora local), del más reciente al más viejo. */
export function groupPurchasesByMonth(purchases: Purchase[]): PurchaseMonth[] {
  const sorted = [...purchases].sort((a, b) => b.boughtAt.localeCompare(a.boughtAt));
  const months = new Map<string, PurchaseMonth>();
  for (const purchase of sorted) {
    const date = new Date(purchase.boughtAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = months.get(key) ?? { key, label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`, total: 0, purchases: [] };
    month.total += purchase.total ?? 0;
    month.purchases.push(purchase);
    months.set(key, month);
  }
  return [...months.values()];
}
