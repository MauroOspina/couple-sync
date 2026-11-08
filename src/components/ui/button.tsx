import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Más bajo y sin ancho completo, para barras y encabezados. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const foreground = {
    primary: colors.onPrimary,
    secondary: colors.text,
    ghost: colors.primary,
    danger: colors.danger,
  }[variant];
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  }[variant];
  const pressedStyle = {
    primary: styles.primaryPressed,
    secondary: styles.secondaryPressed,
    ghost: styles.ghostPressed,
    danger: styles.dangerPressed,
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variantStyle,
        pressed && pressedStyle,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={foreground} /> : null}
          <AppText variant="bodyStrong" style={{ color: foreground }} numberOfLines={1}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.lg },
  primary: { backgroundColor: theme.colors.primary },
  primaryPressed: { backgroundColor: theme.colors.primaryPressed },
  secondary: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  secondaryPressed: { backgroundColor: theme.colors.border },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: theme.colors.primarySoft },
  danger: { backgroundColor: theme.colors.dangerSoft },
  dangerPressed: { opacity: 0.8 },
  inactive: { opacity: 0.5 },
}));
