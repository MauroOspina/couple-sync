import { CATEGORIES, CATEGORY_KEYWORDS, DEFAULT_CATEGORY, STARTER_CATALOG } from '@/constants/catalog';
import type { SyncedItem } from '@/domain/collection';
import { matchKey, normalizeText } from '@/domain/text';

export type StockStatus = 'ok' | 'low' | 'out';

export interface Product extends SyncedItem {
  name: string;
  category: string;
  status: StockStatus;
  /** Ya está en el carrito (solo importa mientras se hace el mercado). */
  inCart?: boolean;
}

export const NEXT_STATUS: Record<StockStatus, StockStatus> = { ok: 'low', low: 'out', out: 'ok' };

export function toStockStatus(value: unknown): StockStatus {
  return value === 'low' || value === 'out' ? value : 'ok';
}

export const isNeeded = (product: Product) => product.status !== 'ok';

export function categoryEmoji(category: string): string {
  return CATEGORIES[category] ?? CATEGORIES[DEFAULT_CATEGORY];
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function searchProducts(products: Product[], query: string): Product[] {
  const needle = normalizeText(query);
  if (!needle) return products;
  return products.filter(product => normalizeText(product.name).includes(needle));
}

export interface CategorySummary {
  category: string;
  emoji: string;
  total: number;
  needed: number;
}

/** Categorías con al menos un producto, en orden alfabético. */
export function summarizeCategories(products: Product[]): CategorySummary[] {
  const stats = new Map<string, CategorySummary>();
  for (const product of products) {
    const category = product.category || DEFAULT_CATEGORY;
    const entry = stats.get(category) ?? { category, emoji: categoryEmoji(category), total: 0, needed: 0 };
    entry.total += 1;
    if (isNeeded(product)) entry.needed += 1;
    stats.set(category, entry);
  }
  return [...stats.values()].sort((a, b) => a.category.localeCompare(b.category, 'es'));
}

export interface CategoryGroup {
  category: string;
  emoji: string;
  items: Product[];
}

export function groupByCategory(products: Product[]): CategoryGroup[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const category = product.category || DEFAULT_CATEGORY;
    groups.set(category, [...(groups.get(category) ?? []), product]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([category, items]) => ({ category, emoji: categoryEmoji(category), items: sortByName(items) }));
}

/** Productos que estaban en el carrito, ya comprados: vuelven a "Hay". Devuelve solo los que cambian. */
export function finishShopping(products: Product[]): Product[] {
  return products.filter(product => product.inCart).map(product => ({ ...product, status: 'ok' as const, inCart: false }));
}

const STATUS_PRIORITY: Record<StockStatus, number> = { ok: 0, low: 1, out: 2 };

/**
 * Busca un producto por nombre de forma tolerante (tildes, plurales, cantidades):
 * "2 huevos" → "Huevos", "queso" → "Queso campesino".
 */
export function findProduct(products: Product[], name: string): Product | undefined {
  const target = matchKey(name);
  if (target.length < 3) return undefined;

  const exact = products.filter(product => matchKey(product.name) === target);
  const candidates = exact.length
    ? exact
    : products.filter(product => {
        const key = matchKey(product.name);
        return key.length >= 3 && (` ${key} `.includes(` ${target} `) || ` ${target} `.includes(` ${key} `));
      });

  return [...candidates].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || a.name.length - b.name.length,
  )[0];
}

const STARTER_CATEGORY_BY_KEY = new Map(
  STARTER_CATALOG.flatMap(group => group.items.map(item => [matchKey(item), group.category] as const)),
);

const KEYWORDS = Object.entries(CATEGORY_KEYWORDS).map(([category, words]) => ({
  category,
  keys: words.map(matchKey),
}));

/** Adivina la categoría de un producto nuevo por su nombre. */
export function guessCategory(name: string): string {
  const key = matchKey(name);
  if (!key) return DEFAULT_CATEGORY;
  const starter = STARTER_CATEGORY_BY_KEY.get(key);
  if (starter) return starter;
  const padded = ` ${key} `;
  const match = KEYWORDS.find(({ keys }) => keys.some(word => padded.includes(` ${word} `)));
  return match?.category ?? DEFAULT_CATEGORY;
}

/** Despensa inicial (mismos ids de siempre para no duplicar en hogares viejos). */
export function createStarterProducts(): Product[] {
  let nextId = 1;
  return STARTER_CATALOG.flatMap(group =>
    [...group.items].sort().map(name => ({
      id: String(nextId++),
      name,
      category: group.category,
      status: 'ok' as const,
      inCart: false,
    })),
  );
}
