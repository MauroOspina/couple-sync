import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { cardShadow, radius, spacing } from '@/constants/theme';
import { makeStyles } from '@/hooks/use-app-theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** `false` para tarjetas con filas que manejan su propio padding. */
  padded?: boolean;
}

export function Card({ children, style, onPress, onLongPress, accessibilityLabel, accessibilityHint, padded = true }: CardProps) {
  const styles = useStyles();
  if (onPress || onLongPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.card, padded && styles.padded, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.border,
    ...cardShadow(theme),
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
}));
