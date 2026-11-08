import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import type { CategorySummary } from '@/domain/inventory';
import { makeStyles } from '@/hooks/use-app-theme';

interface CategoryGridProps {
  categories: CategorySummary[];
  onSelect: (category: string) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {categories.map(item => (
        <Card
          key={item.category}
          style={styles.card}
          onPress={() => onSelect(item.category)}
          accessibilityLabel={`${item.category}: ${item.total} productos${item.needed ? `, ${item.needed} por comprar` : ''}`}>
          {item.needed > 0 ? (
            <View style={styles.badge}>
              <AppText variant="caption" style={styles.badgeText}>
                {item.needed}
              </AppText>
            </View>
          ) : null}
          <AppText style={styles.emoji}>{item.emoji}</AppText>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
            {item.category}
          </AppText>
          <AppText variant="caption" tone="subtle">
            {item.total} {item.total === 1 ? 'producto' : 'productos'}
          </AppText>
        </Card>
      ))}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  emoji: { fontSize: 36, lineHeight: 44 },
  title: { textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.colors.onAccent },
}));
