import { Alert, View } from 'react-native';

import { recipeMeta } from '@/components/recipes/recipe-card';
import { AppText, Button, Icon, Sheet, type IconName } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { checkIngredients, summarizeAvailability, type IngredientState, type Recipe } from '@/domain/recipes';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';
import { useRecipes } from '@/providers/recipes-provider';

const STATE_INFO: Record<IngredientState, { icon: IconName; label: string }> = {
  have: { icon: 'checkCircle', label: 'Hay' },
  low: { icon: 'cart', label: 'Queda poco · en la lista' },
  missing: { icon: 'cart', label: 'Falta · en la lista' },
  unknown: { icon: 'cartAdd', label: 'No está en la despensa' },
};

interface RecipeDetailSheetProps {
  recipe: Recipe | null;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
}

export function RecipeDetailSheet({ recipe, onClose, onEdit }: RecipeDetailSheetProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { products, addMissingToMarket } = useInventory();
  const { deleteRecipe } = useRecipes();

  if (!recipe) return null;

  const checks = checkIngredients(recipe, products);
  const summary = summarizeAvailability(checks);
  const steps = recipe.steps.split(/\r?\n/).map(step => step.trim()).filter(Boolean);
  const stateColor: Record<IngredientState, string> = {
    have: theme.colors.success,
    low: theme.colors.warning,
    missing: theme.colors.danger,
    unknown: theme.colors.textSubtle,
  };

  const addToMarket = () => {
    const added = addMissingToMarket(summary.unknown);
    Alert.alert(
      'Lista del mercado actualizada',
      added === 1 ? 'Se agregó 1 ingrediente al mercado.' : `Se agregaron ${added} ingredientes al mercado.`,
    );
  };

  const confirmDelete = () => {
    Alert.alert('¿Eliminar receta?', `"${recipe.title}" se borrará para los dos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteRecipe(recipe.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Sheet
      visible
      onClose={onClose}
      title={`${recipe.emoji} ${recipe.title}`}
      footer={
        <>
          <Button label="Editar" icon="edit" variant="secondary" style={styles.footerButton} onPress={() => onEdit(recipe)} />
          <Button label="Eliminar" icon="delete" variant="danger" style={styles.footerButton} onPress={confirmDelete} />
        </>
      }>
      <AppText variant="small" tone="muted">
        {recipeMeta(recipe)}
      </AppText>

      <View style={styles.section}>
        <AppText variant="label" tone="muted">
          Ingredientes · tienes {summary.have} de {summary.total}
        </AppText>
        {checks.map(check => (
          <View key={check.name} style={styles.ingredient}>
            <Icon name={STATE_INFO[check.state].icon} size={20} color={stateColor[check.state]} />
            <View style={styles.ingredientText}>
              <AppText variant="body">{check.name}</AppText>
              <AppText variant="caption" style={{ color: stateColor[check.state] }}>
                {STATE_INFO[check.state].label}
              </AppText>
            </View>
          </View>
        ))}
        {summary.unknown.length > 0 ? (
          <Button
            label={`Agregar ${summary.unknown.length} al mercado`}
            icon="cartAdd"
            onPress={addToMarket}
            accessibilityHint="Agrega a la lista del mercado los ingredientes que no están en la despensa"
          />
        ) : null}
      </View>

      {steps.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" tone="muted">
            Preparación
          </AppText>
          {steps.map((step, index) => (
            <View key={`${index}-${step}`} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="smallStrong" tone="primary">
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="body" style={styles.stepText}>
                {step}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}

const useStyles = makeStyles(theme => ({
  section: { gap: spacing.md },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ingredientText: { flex: 1 },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  footerButton: { flex: 1 },
}));
