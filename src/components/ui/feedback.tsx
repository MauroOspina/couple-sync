import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  children?: ReactNode;
}

/** Pantalla vacía con explicación y acciones: nunca dejes una lista vacía sin contexto. */
export function EmptyState({ emoji, title, message, children }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <View style={styles.emojiCircle}>
        <AppText style={styles.emoji}>{emoji}</AppText>
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="small" tone="muted" style={styles.center}>
        {message}
      </AppText>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

/** Aviso en línea (sin conexión, cambios pendientes...). */
export function Banner({ icon, message, tone = 'warning' }: { icon: IconName; message: string; tone?: 'warning' | 'info' }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const color = tone === 'warning' ? colors.warning : colors.primary;
  return (
    <View style={[styles.banner, tone === 'warning' ? styles.bannerWarning : styles.bannerInfo]} accessibilityRole="alert">
      <Icon name={icon} size={18} color={color} />
      <AppText variant="caption" style={[styles.bannerText, { color }]}>
        {message}
      </AppText>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.fill, { width, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <AppText variant="label" tone="muted" accessibilityRole="header">
        {title}
      </AppText>
      {right}
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const palette = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.accentSoft, fg: colors.accent },
    { bg: colors.warningSoft, fg: colors.warning },
  ];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: palette[index].bg }]}>
      <AppText variant="smallStrong" style={{ color: palette[index].fg }}>
        {initials || '?'}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, gap: spacing.sm },
  emojiCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: { fontSize: 40, lineHeight: 48 },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  bannerWarning: { backgroundColor: theme.colors.warningSoft },
  bannerInfo: { backgroundColor: theme.colors.primarySoft },
  bannerText: { flex: 1 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
}));
