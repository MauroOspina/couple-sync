import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { radius } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  /** Obligatorio: es lo que lee el lector de pantalla. */
  accessibilityLabel: string;
  variant?: 'plain' | 'tonal' | 'primary';
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'tonal',
  size = 40,
  disabled = false,
  style,
}: IconButtonProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const color = variant === 'primary' ? colors.onPrimary : variant === 'tonal' ? colors.primary : colors.textMuted;
  const variantStyle = { plain: styles.plain, tonal: styles.tonal, primary: styles.primary }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={Math.max(0, (48 - size) / 2)}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        variantStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Icon name={icon} size={Math.round(size * 0.55)} color={color} />
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  plain: { backgroundColor: 'transparent' },
  tonal: { backgroundColor: theme.colors.primarySoft },
  primary: { backgroundColor: theme.colors.primary },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
}));
