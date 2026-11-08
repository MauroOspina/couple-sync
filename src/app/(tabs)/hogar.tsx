import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';

import { AppText, Avatar, Button, Card, Icon, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { APP_CONFIG } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

/** Hogar compartido, cuenta y ajustes. */
export default function HouseholdScreen() {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const { user, isGuest, household, members, signOut, exitGuestMode, leaveHousehold, deleteAccount } = useSession();
  const [deleting, setDeleting] = useState(false);

  const shareCode = () => {
    if (!household) return;
    void Share.share({
      message: `¡Únete a nuestro hogar "${household.name}" en ${APP_CONFIG.name}! Inicia sesión con Google y escribe este código: ${household.inviteCode}`,
    });
  };

  const confirmLeave = () => {
    Alert.alert('¿Salir del hogar?', 'Dejarás de ver la despensa, las recetas y las tareas compartidas. Puedes volver con el código.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () =>
          void leaveHousehold().catch((error: unknown) =>
            Alert.alert('No se pudo salir', error instanceof Error ? error.message : 'Revisa tu conexión.'),
          ),
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      '¿Eliminar tu cuenta?',
      'Se borrarán tu cuenta y tus datos. Si eres la única persona del hogar, también se borrarán la despensa, las recetas y las tareas. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
              Alert.alert('Cuenta eliminada', 'Tus datos se borraron. Gracias por usar Couple Sync.');
            } catch (error) {
              Alert.alert('No se pudo eliminar la cuenta', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const version = Constants.expoConfig?.version ?? '—';
  const updateId = Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : '';
  const channel = Updates.channel ? ` · ${Updates.channel}` : '';

  return (
    <Screen>
      <ScreenHeader title="Hogar" subtitle={household?.name ?? (isGuest ? 'Modo local' : undefined)} />
      <ScrollView contentContainerStyle={styles.content}>
        {household ? (
          <Card style={styles.inviteCard}>
            <AppText variant="label" tone="muted">
              Código de invitación
            </AppText>
            <AppText variant="title" tone="primary" selectable style={styles.code}>
              {household.inviteCode}
            </AppText>
            <AppText variant="small" tone="muted" style={styles.center}>
              Tu pareja inicia sesión con Google y escribe este código para unirse.
            </AppText>
            <Button label="Compartir código" icon="share" onPress={shareCode} />
          </Card>
        ) : null}

        {household ? (
          <>
            <SectionTitle title={`Miembros · ${members.length}`} />
            <Card padded={false}>
              {members.map((member, index) => (
                <View key={member.userId} style={[styles.memberRow, index > 0 && styles.divider]}>
                  <Avatar name={member.name} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">
                      {member.name}
                      {member.userId === user?.id ? ' (tú)' : ''}
                    </AppText>
                    <AppText variant="caption" tone="subtle">
                      {member.role === 'owner' ? 'Creó el hogar' : 'Miembro'}
                    </AppText>
                  </View>
                  <Icon name="heart" size={18} color={colors.accent} />
                </View>
              ))}
              {members.length < 2 ? (
                <View style={[styles.memberRow, members.length > 0 && styles.divider]}>
                  <AppText variant="small" tone="muted" style={styles.flex}>
                    Aún estás solo en el hogar. Comparte el código para que tu pareja se una.
                  </AppText>
                </View>
              ) : null}
            </Card>
          </>
        ) : null}

        {isGuest ? (
          <Card style={styles.guestCard}>
            <AppText variant="heading">Estás en modo local</AppText>
            <AppText variant="small" tone="muted">
              Tus datos están solo en este teléfono. Inicia sesión con Google para compartirlos con tu pareja en tiempo real.
            </AppText>
            {isSupabaseConfigured ? (
              <Button label="Iniciar sesión con Google" icon="person" onPress={() => void exitGuestMode()} />
            ) : null}
          </Card>
        ) : null}

        {user ? (
          <>
            <SectionTitle title="Cuenta" />
            <Card style={styles.accountCard}>
              <View style={styles.memberRow}>
                <Avatar name={members.find(member => member.userId === user.id)?.name ?? user.email ?? '?'} />
                <AppText variant="small" tone="muted" style={styles.flex} numberOfLines={1}>
                  {user.email}
                </AppText>
              </View>
              <Button label="Cerrar sesión" icon="logout" variant="secondary" onPress={() => void signOut()} />
              {household ? <Button label="Salir del hogar" icon="userRemove" variant="secondary" onPress={confirmLeave} /> : null}
              <Button label="Eliminar mi cuenta" icon="delete" variant="danger" loading={deleting} onPress={confirmDelete} />
            </Card>
          </>
        ) : null}

        <SectionTitle title="Acerca de" />
        <Card style={styles.accountCard}>
          <Button
            label="Política de privacidad"
            icon="privacy"
            variant="ghost"
            onPress={() => void WebBrowser.openBrowserAsync(APP_CONFIG.links.privacy)}
          />
          <AppText variant="caption" tone="subtle" style={styles.center}>
            {APP_CONFIG.name} {version}
            {channel}
            {updateId}
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  content: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.sm },
  inviteCard: { alignItems: 'stretch', gap: spacing.md },
  code: {
    textAlign: 'center',
    letterSpacing: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colors.primarySoft,
    overflow: 'hidden',
  },
  center: { textAlign: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divider: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  flex: { flex: 1 },
  guestCard: { gap: spacing.md, marginTop: spacing.sm },
  accountCard: { gap: spacing.sm },
}));
