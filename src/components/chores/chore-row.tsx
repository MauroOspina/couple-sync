import { Pressable, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { cardShadow, radius, spacing } from '@/constants/theme';
import { repeatLabel, repeatRuleOf, type Chore } from '@/domain/chores';
import { formatDueLabel, type ISODate } from '@/domain/dates';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface ChoreRowProps {
  chore: Chore;
  today: ISODate;
  assigneeName: string | null;
  onToggle: () => void;
  onEdit: () => void;
}

export function ChoreRow({ chore, today, assigneeName, onToggle, onEdit }: ChoreRowProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const overdue = !chore.done && chore.dueDate !== null && chore.dueDate < today;
  const dueToday = !chore.done && chore.dueDate === today;
  const dueColor = overdue ? colors.danger : dueToday ? colors.primary : colors.textMuted;

  return (
    <View style={[styles.row, chore.done && styles.rowDone]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: chore.done }}
        accessibilityLabel={chore.done ? `Marcar "${chore.title}" como pendiente` : `Completar "${chore.title}"`}
        hitSlop={8}
        onPress={onToggle}
        style={({ pressed }) => [styles.check, pressed && styles.pressed]}>
        <Icon name={chore.done ? 'checkCircle' : 'circle'} size={28} color={chore.done ? colors.primary : colors.textSubtle} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${chore.title}. Toca para editar`}
        onPress={onEdit}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <AppText style={styles.emoji}>{chore.emoji}</AppText>
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={2} style={chore.done && styles.titleDone}>
            {chore.title}
          </AppText>
          <View style={styles.meta}>
            {chore.dueDate && !chore.done ? (
              <AppText variant="caption" style={{ color: dueColor }}>
                {formatDueLabel(chore.dueDate, today)}
              </AppText>
            ) : null}
            {chore.frequency !== 'once' ? (
              <View style={styles.metaItem}>
                <Icon name="repeat" size={14} color={colors.textSubtle} />
                <AppText variant="caption" tone="subtle">
                  {repeatLabel(repeatRuleOf(chore))}
                </AppText>
              </View>
            ) : null}
            {assigneeName ? (
              <View style={styles.metaItem}>
                <Icon name="person" size={14} color={colors.textSubtle} />
                <AppText variant="caption" tone="subtle">
                  {assigneeName}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.sm,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.border,
    ...cardShadow(theme),
  },
  rowDone: { opacity: 0.7 },
  check: { padding: spacing.sm },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 24, lineHeight: 30 },
  texts: { flex: 1, gap: 2 },
  titleDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.md, rowGap: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
}));
