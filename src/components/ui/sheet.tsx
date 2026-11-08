import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { radius, spacing } from '@/constants/theme';
import { makeStyles } from '@/hooks/use-app-theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Botones fijos abajo (Guardar, Cancelar...). */
  footer?: ReactNode;
}

/** Hoja que sube desde abajo, para editar o ver detalles sin salir de la pantalla. */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable style={styles.backdrop} accessibilityLabel="Cerrar" onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(240)}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={2}>
              {title}
            </AppText>
            <IconButton icon="close" variant="plain" accessibilityLabel="Cerrar" onPress={onClose} />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles(theme => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.overlay },
  sheet: {
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: { flex: 1 },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));
