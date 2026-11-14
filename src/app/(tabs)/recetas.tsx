import { useMemo, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { RecipeCard } from '@/components/recipes/recipe-card';
import { RecipeDetailSheet } from '@/components/recipes/recipe-detail-sheet';
import { RecipeEditorSheet } from '@/components/recipes/recipe-editor-sheet';
import { RecipeIdeasSheet } from '@/components/recipes/recipe-ideas-sheet';
import { Button, EmptyState, IconButton, LoadingView, Screen, ScreenHeader } from '@/components/ui';
import { APP_CONFIG } from '@/constants/config';
import { spacing } from '@/constants/theme';
import type { RecipeContent } from '@/domain/recipe-import';
import { checkIngredients, summarizeAvailability, type Recipe } from '@/domain/recipes';
import { makeStyles } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';
import { useRecipes } from '@/providers/recipes-provider';

/** Recetas del hogar, ordenadas por cuántos ingredientes ya hay en la despensa. */
export default function RecipesScreen() {
  const styles = useStyles();
  const { recipes, ready, canAddRecipe, addSampleRecipes, importRequest, clearImportRequest } = useRecipes();
  const { products } = useInventory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ recipe: Recipe | null; initial?: RecipeContent } | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);

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
  // "Compartir → Nest": una receta abre el editor ya lleno; varias abren la hoja para elegir cuál.
  const sharedSingle = importRequest?.recipes.length === 1 ? importRequest.recipes[0] : null;
  const sharedMany = importRequest && importRequest.recipes.length > 1 ? importRequest.text : null;
  const editorInitial = editor?.initial ?? sharedSingle ?? undefined;

  const openNew = (initial?: RecipeContent) => {
    if (!canAddRecipe) {
      Alert.alert('Límite del plan gratuito', `Muy pronto podrás guardar recetas ilimitadas con ${APP_CONFIG.name} Premium.`);
      return;
    }
    setIdeasOpen(false);
    setEditor({ recipe: null, initial });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Recetas"
        subtitle={recipes.length ? 'Primero las que pueden preparar ya' : undefined}
        right={
          <View style={styles.headerActions}>
            <IconButton icon="sparkles" accessibilityLabel="Ideas de recetas con IA" onPress={() => setIdeasOpen(true)} />
            <IconButton icon="add" variant="primary" accessibilityLabel="Nueva receta" onPress={() => openNew()} />
          </View>
        }
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
            <Button label="Crear receta" icon="add" onPress={() => openNew()} />
            <Button label="Ideas con IA según mi despensa" icon="sparkles" variant="secondary" onPress={() => setIdeasOpen(true)} />
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
      <RecipeEditorSheet
        visible={editor !== null || sharedSingle !== null}
        recipe={editor?.recipe ?? null}
        initial={editorInitial}
        onClose={() => {
          setEditor(null);
          clearImportRequest();
        }}
        // Una receta traída de la IA se muestra al guardarla, con lo que falta de la despensa.
        onSaved={saved => (editorInitial ? setSelectedId(saved.id) : undefined)}
      />
      <RecipeIdeasSheet
        visible={ideasOpen || sharedMany !== null}
        initialPaste={sharedMany}
        onClose={() => {
          setIdeasOpen(false);
          clearImportRequest();
        }}
        onImport={recipe => {
          clearImportRequest();
          openNew(recipe);
        }}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.md }} />;
}

const useStyles = makeStyles(() => ({
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
}));
