import type { Recipe } from '@/domain/recipes';
import { asyncStorageCache, type CollectionAdapter } from '@/services/collection';
import { asNullableNumber, asNullableString, asString, asStringArray } from '@/services/rows';

export const recipesAdapter: CollectionAdapter<Recipe> = {
  table: 'recipes',
  fromRow: row => ({
    id: asString(row.id),
    title: asString(row.title),
    emoji: asString(row.emoji, '🍲') || '🍲',
    servings: asNullableNumber(row.servings),
    prepMinutes: asNullableNumber(row.prep_minutes),
    ingredients: asStringArray(row.ingredients),
    steps: asString(row.steps),
    updatedAt: asNullableString(row.updated_at),
  }),
  toRow: (recipe, householdId) => ({
    id: recipe.id,
    household_id: householdId,
    title: recipe.title,
    emoji: recipe.emoji,
    servings: recipe.servings,
    prep_minutes: recipe.prepMinutes,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    updated_at: recipe.updatedAt ?? new Date().toISOString(),
  }),
  ...asyncStorageCache<Recipe>('recipes'),
};
