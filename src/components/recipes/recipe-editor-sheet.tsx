import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button, EmojiPicker, Sheet, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { parseIngredientLines, parsePositiveInt, RECIPE_EMOJIS, type Recipe } from '@/domain/recipes';
import { makeStyles } from '@/hooks/use-app-theme';
import { useRecipes } from '@/providers/recipes-provider';

interface RecipeEditorSheetProps {
  visible: boolean;
  /** `null` = receta nueva. */
  recipe: Recipe | null;
  onClose: () => void;
  onSaved?: (recipe: Recipe) => void;
}

export function RecipeEditorSheet({ visible, recipe, onClose, onSaved }: RecipeEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={recipe ? 'Editar receta' : 'Nueva receta'}>
      {visible ? <RecipeForm key={recipe?.id ?? 'new'} recipe={recipe} onClose={onClose} onSaved={onSaved} /> : null}
    </Sheet>
  );
}

function RecipeForm({ recipe, onClose, onSaved }: Omit<RecipeEditorSheetProps, 'visible'>) {
  const styles = useStyles();
  const { saveRecipe } = useRecipes();
  const [emoji, setEmoji] = useState(recipe?.emoji ?? RECIPE_EMOJIS[0]);
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [servings, setServings] = useState(recipe?.servings ? String(recipe.servings) : '');
  const [minutes, setMinutes] = useState(recipe?.prepMinutes ? String(recipe.prepMinutes) : '');
  const [ingredients, setIngredients] = useState(recipe?.ingredients.join('\n') ?? '');
  const [steps, setSteps] = useState(recipe?.steps ?? '');

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
        <EmojiPicker options={RECIPE_EMOJIS} value={emoji} onChange={setEmoji} />
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
