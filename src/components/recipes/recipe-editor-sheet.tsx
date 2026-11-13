import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button, EmojiPicker, Sheet, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import type { RecipeContent } from '@/domain/recipe-import';
import { parseIngredientLines, parsePositiveInt, RECIPE_EMOJIS, type Recipe } from '@/domain/recipes';
import { makeStyles } from '@/hooks/use-app-theme';
import { useRecipes } from '@/providers/recipes-provider';

interface RecipeEditorSheetProps {
  visible: boolean;
  /** `null` = receta nueva. */
  recipe: Recipe | null;
  /** Para una receta nueva: datos con que llenar el formulario (p. ej. una receta pegada de la IA). */
  initial?: RecipeContent | null;
  onClose: () => void;
  onSaved?: (recipe: Recipe) => void;
}

export function RecipeEditorSheet({ visible, recipe, initial, onClose, onSaved }: RecipeEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={recipe ? 'Editar receta' : initial ? 'Revisa la receta' : 'Nueva receta'}>
      {visible ? (
        <RecipeForm
          key={recipe?.id ?? initial?.title ?? 'new'}
          recipe={recipe}
          initial={initial}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Sheet>
  );
}

function RecipeForm({ recipe, initial, onClose, onSaved }: Omit<RecipeEditorSheetProps, 'visible'>) {
  const styles = useStyles();
  const { saveRecipe } = useRecipes();
  const source = recipe ?? initial ?? null;
  const [emoji, setEmoji] = useState(source?.emoji ?? RECIPE_EMOJIS[0]);
  const [title, setTitle] = useState(source?.title ?? '');
  const [servings, setServings] = useState(source?.servings ? String(source.servings) : '');
  const [minutes, setMinutes] = useState(source?.prepMinutes ? String(source.prepMinutes) : '');
  const [ingredients, setIngredients] = useState(source?.ingredients.join('\n') ?? '');
  const [steps, setSteps] = useState(source?.steps ?? '');
  // Un emoji que trajo la IA y no está en la lista se ofrece primero para no perderlo.
  const emojiOptions =
    source?.emoji && !RECIPE_EMOJIS.includes(source.emoji) ? [source.emoji, ...RECIPE_EMOJIS] : RECIPE_EMOJIS;

  const save = () => {
    const cleanTitle = title.trim();
    const list = parseIngredientLines(ingredients);
    if (!cleanTitle) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a la receta.');
      return;
    }
    if (list.length === 0) {
      Alert.alert('Faltan ingredientes', 'Escribe al menos un ingrediente, uno por línea.');
      return;
    }
    const saved = saveRecipe(
      {
        title: cleanTitle,
        emoji,
        servings: parsePositiveInt(servings, 50),
        prepMinutes: parsePositiveInt(minutes, 1440),
        ingredients: list,
        steps: steps.trim(),
      },
      recipe?.id,
    );
    onSaved?.(saved);
    onClose();
  };

  return (
    <>
      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Ícono
        </AppText>
        <EmojiPicker options={emojiOptions} value={emoji} onChange={setEmoji} />
      </View>
      <TextField label="Nombre" value={title} onChangeText={setTitle} placeholder="Ej: Arroz con pollo" autoCapitalize="sentences" />
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField label="Porciones" value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="2" />
        </View>
        <View style={styles.half}>
          <TextField label="Minutos" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" placeholder="30" />
        </View>
      </View>
      <TextField
        label="Ingredientes"
        hint="Uno por línea. Se comparan con tu despensa para saber qué falta."
        value={ingredients}
        onChangeText={setIngredients}
        placeholder={'2 huevos\nQueso campesino\nArepas'}
        multiline
      />
      <TextField label="Preparación" hint="Un paso por línea." value={steps} onChangeText={setSteps} placeholder="Paso 1..." multiline />
      <Button label={recipe ? 'Guardar cambios' : 'Crear receta'} icon="check" onPress={save} />
    </>
  );
}

const useStyles = makeStyles(() => ({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
}));
