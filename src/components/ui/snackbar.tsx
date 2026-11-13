import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { cardShadow, radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface SnackbarProps {
  message: string;
  icon?: IconName;
  /** Botón a la derecha, por ejemplo "Deshacer". */
  actionLabel?: string;
  onAction?: () => void;
  /** Contenido extra bajo el mensaje. */
  children?: ReactNode;
}

/**
 * Aviso flotante abajo de la pantalla, para confirmar una acción y ofrecer deshacerla.
 * Se muestra mientras esté montado: quien lo usa decide cuándo quitarlo.
 */
export function Snackbar({ message, icon, actionLabel, onAction, children }: SnackbarProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="box-none"
      style={styles.wrap}>
      <View style={styles.card} accessibilityLiveRegion="polite">
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={22} color={colors.primary} /> : null}
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.message}>
            {message}
          </AppText>
          {actionLabel && onAction ? <Button label={actionLabel} variant="ghost" compact onPress={onAction} /> : null}
        </View>
        {children}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles(theme => ({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...cardShadow(theme),
    // Por encima de la lista también en Android.
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  message: { flex: 1 },
}));
