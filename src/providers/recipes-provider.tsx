import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

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
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: PropsWithChildren) {
  const { household } = useSession();
  const { isPremium, freeRecipeLimit } = usePremium();
  const { items, ready, save, remove } = useSyncedCollection(recipesAdapter, household?.id ?? null);

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
    }),
    [items, ready, isPremium, freeRecipeLimit, save, remove],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes(): RecipesContextValue {
  const context = useContext(RecipesContext);
  if (!context) throw new Error('useRecipes debe usarse dentro de <RecipesProvider>');
  return context;
}
