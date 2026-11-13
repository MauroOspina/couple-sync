import type { SyncedItem } from '@/domain/collection';
import { findProduct, type Product } from '@/domain/inventory';
import { normalizeText } from '@/domain/text';

export interface Recipe extends SyncedItem {
  title: string;
  emoji: string;
  servings: number | null;
  prepMinutes: number | null;
  /** Un ingrediente por elemento, tal como lo escribió la persona ("2 huevos"). */
  ingredients: string[];
  /** Pasos en texto libre, uno por línea. */
  steps: string;
}

export const RECIPE_EMOJIS = ['🍲', '🍝', '🥗', '🍳', '🥞', '🌮', '🍛', '🥘', '🍗', '🐟', '🥪', '🍰'];

/** have = hay · low = queda poco · missing = está en la despensa pero falta · unknown = no está en la despensa */
export type IngredientState = 'have' | 'low' | 'missing' | 'unknown';

export interface IngredientCheck {
  name: string;
  product: Product | null;
  state: IngredientState;
}

export function checkIngredients(recipe: Pick<Recipe, 'ingredients'>, products: Product[]): IngredientCheck[] {
  return recipe.ingredients.map(name => {
    const product = findProduct(products, name) ?? null;
    const state: IngredientState = !product
      ? 'unknown'
      : product.status === 'ok'
        ? 'have'
        : product.status === 'low'
          ? 'low'
          : 'missing';
    return { name, product, state };
  });
}

export interface AvailabilitySummary {
  have: number;
  total: number;
  /** Ingredientes que no están en la despensa: se pueden agregar al mercado. */
  unknown: string[];
  /** Ingredientes ya marcados como "Queda poco" o "Falta" (ya están en la lista del mercado). */
  alreadyNeeded: number;
}

export function summarizeAvailability(checks: IngredientCheck[]): AvailabilitySummary {
  return {
    have: checks.filter(check => check.state === 'have').length,
    total: checks.length,
    unknown: checks.filter(check => check.state === 'unknown').map(check => check.name),
    alreadyNeeded: checks.filter(check => check.state === 'low' || check.state === 'missing').length,
  };
}

/** Convierte el texto del editor en una lista limpia: quita viñetas, vacíos y repetidos. */
export function parseIngredientLines(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const clean = line.replace(/^\s*([-•*·]|\d+[.)])\s+/, '').trim();
    const key = normalizeText(clean);
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

export function parsePositiveInt(value: string, max: number): number | null {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(parsed, max);
}

/** Productos que hay o de los que queda poco, sin repetidos: lo que se le cuenta a la IA. */
export function pantryForIdeas(products: Pick<Product, 'name' | 'status'>[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const product of products) {
    const name = product.name.trim();
    const key = normalizeText(name);
    if (product.status === 'out' || !name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export const MAX_CRAVING_LENGTH = 200;

/**
 * Pregunta lista para pegar en Gemini, el Modo IA de Google u otra IA.
 * Se corta la lista de ingredientes para no pasar de `maxLength` (los links muy largos fallan).
 */
export function buildRecipePrompt(ingredients: string[], craving: string, maxLength = 1200): string {
  const wish = craving.trim().slice(0, MAX_CRAVING_LENGTH);
  const intro =
    'Propón 3 recetas caseras y fáciles usando sobre todo lo que tengo en la despensa. ' +
    'Para cada una dame nombre, tiempo, porciones, ingredientes con cantidades y pasos cortos. Responde en español.';
  const wishLine = wish ? ` Antojo: ${wish}.` : '';
  const budget = maxLength - intro.length - wishLine.length - ' Tengo: . y más'.length;

  const included: string[] = [];
  let used = 0;
  for (const item of ingredients) {
    const cost = item.length + (included.length ? 2 : 0);
    if (used + cost > budget) break;
    included.push(item);
    used += cost;
  }
  const rest = included.length < ingredients.length ? ' y más' : '';
  const pantry = included.length ? ` Tengo: ${included.join(', ')}${rest}.` : '';
  return `${intro}${pantry}${wishLine}`;
}

/** Recetas de ejemplo con productos del catálogo inicial, para mostrar la app desde el primer día. */
export const SAMPLE_RECIPES: Omit<Recipe, 'id'>[] = [
  {
    title: 'Arepas con huevo y queso',
    emoji: '🍳',
    servings: 2,
    prepMinutes: 15,
    ingredients: ['2 Arepas', '3 Huevos', 'Queso campesino', 'Mantequilla', 'Salero'],
    steps: 'Asa las arepas con un poco de mantequilla.\nRevuelve los huevos con sal.\nAbre las arepas y rellénalas con huevo y queso.',
  },
  {
    title: 'Pasta al pesto con champiñones',
    emoji: '🍝',
    servings: 2,
    prepMinutes: 20,
    ingredients: ['Spaguetti', 'Pesto', 'Champiñones tajados', 'Queso mozarella', 'Aceite oliva', 'Ajo molido'],
    steps: 'Cocina la pasta en agua con sal.\nSaltea los champiñones con aceite y ajo.\nMezcla la pasta con el pesto y los champiñones.\nSirve con queso por encima.',
  },
  {
    title: 'Pancakes de banano',
    emoji: '🥞',
    servings: 2,
    prepMinutes: 15,
    ingredients: ['Mezcla pancakes', '1 Huevo', 'Leche entera', 'Banano', 'Miel'],
    steps: 'Mezcla la harina con el huevo y la leche.\nAgrega el banano en rodajas.\nCocina por ambos lados en sartén caliente.\nSirve con miel.',
  },
];
