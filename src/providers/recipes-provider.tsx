import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { parseRecipeText, type RecipeContent } from '@/domain/recipe-import';
import { SAMPLE_RECIPES, type Recipe } from '@/domain/recipes';
import { usePremium } from '@/hooks/use-premium';
import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createId } from '@/lib/id';
import { useSession } from '@/providers/session-provider';
import { recipesAdapter } from '@/services/recipes';

export type RecipeDraft = Omit<Recipe, 'id' | 'updatedAt'>;

interface RecipesContextValue {
  recipes: Recipe[];
  ready: boolean;
  /** `false` cuando el plan gratuito llegó a su límite (solo si Premium está activo). */
  canAddRecipe: boolean;
  saveRecipe: (draft: RecipeDraft, id?: string) => Recipe;
  deleteRecipe: (id: string) => void;
  addSampleRecipes: () => void;
  /** Recetas que llegaron con "Compartir → Nest" desde otra app (Gemini...), esperando a que la persona las revise. */
  importRequest: ImportRequest | null;
  /** Lee el texto compartido y devuelve cuántas recetas encontró (0 = no deja nada pendiente). */
  importSharedText: (text: string) => number;
  clearImportRequest: () => void;
}

export interface ImportRequest {
  text: string;
  recipes: RecipeContent[];
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: PropsWithChildren) {
  const { household } = useSession();
  const { isPremium, freeRecipeLimit } = usePremium();
  const { items, ready, save, remove } = useSyncedCollection(recipesAdapter, household?.id ?? null);
  const [importRequest, setImportRequest] = useState<ImportRequest | null>(null);

  const value = useMemo<RecipesContextValue>(
    () => ({
      recipes: items,
      ready,
      canAddRecipe: isPremium || items.length < freeRecipeLimit,
      saveRecipe: (draft, id) => {
        const recipe: Recipe = { ...draft, id: id ?? createId() };
        save(recipe);
        return recipe;
      },
      deleteRecipe: id => remove(id),
      addSampleRecipes: () => save(SAMPLE_RECIPES.map(sample => ({ ...sample, id: createId() }))),
      importRequest,
      importSharedText: text => {
        const recipes = parseRecipeText(text);
        setImportRequest(recipes.length ? { text, recipes } : null);
        return recipes.length;
      },
      clearImportRequest: () => setImportRequest(null),
    }),
    [items, ready, isPremium, freeRecipeLimit, save, remove, importRequest],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes(): RecipesContextValue {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes debe usarse dentro de <RecipesProvider>');
  return context;
}
