import { StyleSheet, Text, type TextProps } from 'react-native';

import { fonts, textSizes, type AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'label';

export type TextTone = 'default' | 'muted' | 'subtle' | 'primary' | 'onPrimary' | 'danger' | 'warning' | 'accent';

const toneColor = (theme: AppTheme, tone: TextTone): string =>
  ({
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    subtle: theme.colors.textSubtle,
    primary: theme.colors.primary,
    onPrimary: theme.colors.onPrimary,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    accent: theme.colors.accent,
  })[tone];

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

/** Texto con la tipografía y los colores del tema. Úsalo en lugar de <Text>. */
export function AppText({ variant = 'body', tone = 'default', style, maxFontSizeMultiplier = 1.3, ...rest }: AppTextProps) {
  const theme = useAppTheme();
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...rest}
      style={[styles[variant], { color: toneColor(theme, tone) }, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.heavy, fontSize: textSizes.display, lineHeight: 36 },
  title: { fontFamily: fonts.heavy, fontSize: textSizes.title, lineHeight: 30 },
  heading: { fontFamily: fonts.bold, fontSize: textSizes.heading, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: textSizes.body, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: textSizes.body, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: textSizes.small, lineHeight: 20 },
  smallStrong: { fontFamily: fonts.bold, fontSize: textSizes.small, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: textSizes.caption, lineHeight: 16 },
  label: {
    fontFamily: fonts.bold,
    fontSize: textSizes.caption,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
