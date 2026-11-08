import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Icon, type IconName } from '@/components/ui';
import { APP_CONFIG } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: 'sync', text: 'Despensa y mercado sincronizados en vivo' },
  { icon: 'recipes', text: 'Recetas que saben qué ingredientes tienes' },
  { icon: 'tasks', text: 'Tareas del hogar repartidas entre los dos' },
  { icon: 'lock', text: 'Un espacio privado solo para ustedes' },
];

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { status, signInWithGoogle, continueAsGuest } = useSession();
  const [busy, setBusy] = useState(false);

  const login = async () => {
    try {
      setBusy(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <AppText style={styles.logoEmoji}>💑</AppText>
        </View>
        <AppText variant="display" style={styles.center}>
          {APP_CONFIG.name}
        </AppText>
        <AppText variant="body" tone="muted" style={styles.center}>
          La despensa, el mercado y las tareas del hogar, en sintonía con tu pareja.
        </AppText>
      </View>

      <View style={styles.features}>
        {FEATURES.map(feature => (
          <View key={feature.icon} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Icon name={feature.icon} size={20} color={colors.primary} />
            </View>
            <AppText variant="body" style={styles.featureText}>
              {feature.text}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {isSupabaseConfigured ? (
          <Button label="Continuar con Google" onPress={login} loading={busy || status === 'loading'} />
        ) : null}
        <Button
          label="Probar sin cuenta"
          variant="ghost"
          onPress={() => void continueAsGuest()}
          accessibilityHint="Los datos se guardan solo en este teléfono"
        />
        <AppText variant="caption" tone="subtle" style={styles.center}>
          Sin cuenta, los datos quedan solo en este teléfono. Al continuar aceptas la{' '}
          <AppText
            variant="caption"
            tone="primary"
            accessibilityRole="link"
            onPress={() => void WebBrowser.openBrowserAsync(APP_CONFIG.links.privacy)}>
            política de privacidad
          </AppText>
          .
        </AppText>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: spacing.xl, gap: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.md },
  logo: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoEmoji: { fontSize: 56, lineHeight: 68 },
  center: { textAlign: 'center' },
  features: { gap: spacing.lg },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  actions: { gap: spacing.sm },
}));
