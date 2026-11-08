import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

/** Contenedor de pantalla con el fondo del tema. Sube el contenido cuando aparece el teclado. */
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Muestra la flecha de volver. */
  onBack?: () => void;
  right?: ReactNode;
  /** Contenido bajo el título (buscador, filtros...). */
  children?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right, children }: ScreenHeaderProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        {onBack ? <IconButton icon="back" variant="plain" accessibilityLabel="Volver" onPress={onBack} /> : null}
        <View style={styles.titles}>
          <AppText variant={onBack ? 'title' : 'display'} accessibilityRole="header" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function LoadingView({ message }: { message?: string }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <AppText variant="small" tone="muted">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titles: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: theme.colors.background,
  },
}));
