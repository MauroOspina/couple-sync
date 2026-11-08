import { View } from 'react-native';

import { AppText, Card, ProgressBar } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import type { AvailabilitySummary, Recipe } from '@/domain/recipes';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

export function recipeMeta(recipe: Recipe): string {
  const parts: string[] = [];
  if (recipe.prepMinutes) parts.push(`${recipe.prepMinutes} min`);
  if (recipe.servings) parts.push(`${recipe.servings} ${recipe.servings === 1 ? 'porción' : 'porciones'}`);
  parts.push(`${recipe.ingredients.length} ingredientes`);
  return parts.join(' · ');
}

interface RecipeCardProps {
  recipe: Recipe;
  availability: AvailabilitySummary;
  onPress: () => void;
}

export function RecipeCard({ recipe, availability, onPress }: RecipeCardProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const ratio = availability.total ? availability.have / availability.total : 0;
  const complete = availability.total > 0 && availability.have === availability.total;

  return (
    <Card onPress={onPress} accessibilityLabel={`${recipe.title}. Tienes ${availability.have} de ${availability.total} ingredientes`}>
      <View style={styles.row}>
        <View style={styles.emojiBox}>
          <AppText style={styles.emoji}>{recipe.emoji}</AppText>
        </View>
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {recipe.title}
          </AppText>
          <AppText variant="caption" tone="subtle" numberOfLines={1}>
            {recipeMeta(recipe)}
          </AppText>
        </View>
      </View>
      <View style={styles.availability}>
        <AppText variant="caption" tone={complete ? 'primary' : 'muted'}>
          {complete ? '¡Tienes todo para prepararla!' : `Tienes ${availability.have} de ${availability.total} ingredientes`}
        </AppText>
        <ProgressBar value={ratio} color={complete ? colors.primary : colors.accent} />
      </View>
    </Card>
  );
}

const useStyles = makeStyles(theme => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  texts: { flex: 1, gap: 2 },
  availability: { marginTop: spacing.md, gap: spacing.xs },
}));
