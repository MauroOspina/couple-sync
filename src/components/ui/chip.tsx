import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Opción seleccionable en forma de píldora (categorías, frecuencias, responsables...). */
export function Chip({ label, selected = false, onPress, emoji, icon, style, accessibilityLabel }: ChipProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed, style]}>
      {emoji ? <AppText variant="small">{emoji}</AppText> : null}
      {icon ? <Icon name={icon} size={16} color={selected ? colors.primary : colors.textMuted} /> : null}
      <AppText variant="smallStrong" tone={selected ? 'primary' : 'muted'} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  pressed: { opacity: 0.75 },
}));
