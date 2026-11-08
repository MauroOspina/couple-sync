import { useMemo, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { RecipeCard } from '@/components/recipes/recipe-card';
import { RecipeDetailSheet } from '@/components/recipes/recipe-detail-sheet';
import { RecipeEditorSheet } from '@/components/recipes/recipe-editor-sheet';
import { Button, EmptyState, IconButton, LoadingView, Screen, ScreenHeader } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { checkIngredients, summarizeAvailability, type Recipe } from '@/domain/recipes';
import { makeStyles } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';
import { useRecipes } from '@/providers/recipes-provider';

/** Recetas del hogar, ordenadas por cuántos ingredientes ya hay en la despensa. */
export default function RecipesScreen() {
  const styles = useStyles();
  const { recipes, ready, canAddRecipe, addSampleRecipes } = useRecipes();
  const { products } = useInventory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ recipe: Recipe | null } | null>(null);

  const entries = useMemo(
    () =>
      recipes
        .map(recipe => {
          const availability = summarizeAvailability(checkIngredients(recipe, products));
          const ratio = availability.total ? availability.have / availability.total : 0;
          return { recipe, availability, ratio };
        })
        .sort((a, b) => b.ratio - a.ratio || a.recipe.title.localeCompare(b.recipe.title, 'es')),
    [recipes, products],
  );

  if (!ready) return <LoadingView />;

  const selected = recipes.find(recipe => recipe.id === selectedId) ?? null;

  const openNew = () => {
    if (!canAddRecipe) {
      Alert.alert('Límite del plan gratuito', 'Muy pronto podrás guardar recetas ilimitadas con Couple Sync Premium.');
      return;
    }
    setEditor({ recipe: null });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Recetas"
        subtitle={recipes.length ? 'Primero las que pueden preparar ya' : undefined}
        right={<IconButton icon="add" variant="primary" accessibilityLabel="Nueva receta" onPress={openNew} />}
      />

      <FlatList
        data={entries}
        keyExtractor={entry => entry.recipe.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <RecipeCard recipe={item.recipe} availability={item.availability} onPress={() => setSelectedId(item.recipe.id)} />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🍳"
            title="Aún no hay recetas"
            message="Guarden sus recetas favoritas y la app les dirá qué ingredientes tienen y cuáles faltan.">
            <Button label="Crear receta" icon="add" onPress={openNew} />
            <Button label="Ver 3 recetas de ejemplo" icon="sparkles" variant="secondary" onPress={addSampleRecipes} />
          </EmptyState>
        }
      />

      <RecipeDetailSheet
        recipe={selected}
        onClose={() => setSelectedId(null)}
        onEdit={recipe => {
          setSelectedId(null);
          setEditor({ recipe });
        }}
      />
      <RecipeEditorSheet visible={editor !== null} recipe={editor?.recipe ?? null} onClose={() => setEditor(null)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.md }} />;
}

const useStyles = makeStyles(() => ({
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
}));
