import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, Card, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { makeStyles } from '@/hooks/use-app-theme';
import { useSession } from '@/providers/session-provider';

/** Crear un hogar nuevo o unirse al de la pareja con su código. */
export default function SetupScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { displayName, createHousehold, joinHousehold, signOut, householdError, retryHousehold } = useSession();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  const create = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a tu hogar, por ejemplo "Nuestro nido".');
      return;
    }
    try {
      setBusy('create');
      const household = await createHousehold(name);
      Alert.alert('¡Hogar creado! 🎉', `Comparte este código con tu pareja para que se una:\n\n${household.inviteCode}`);
    } catch (error) {
      Alert.alert('No se pudo crear el hogar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const join = async () => {
    if (!code.trim()) {
      Alert.alert('Falta el código', 'Escribe el código que te compartió tu pareja.');
      return;
    }
    try {
      setBusy('join');
      const household = await joinHousehold(code);
      Alert.alert('¡Listo! 💑', `Ahora comparten "${household.name}".`);
    } catch (error) {
      Alert.alert('No se pudo unir', error instanceof Error ? error.message : 'Verifica el código e inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.intro}>
        <AppText variant="display">¡Hola, {displayName}! 👋</AppText>
        <AppText variant="body" tone="muted">
          Para compartir la despensa con tu pareja, crea un hogar o únete al que ya creó.
        </AppText>
      </View>

      {householdError ? (
        <View style={styles.errorBox}>
          <Banner icon="cloudOff" message="No pudimos revisar si ya tienes un hogar. Revisa tu conexión." />
          <Button label="Reintentar" variant="secondary" icon="sync" compact onPress={retryHousehold} />
        </View>
      ) : null}

      <Card style={styles.card}>
        <AppText variant="heading">🏠 Crear un hogar</AppText>
        <AppText variant="small" tone="muted">
          Recibirás un código para invitar a tu pareja.
        </AppText>
        <TextField value={name} onChangeText={setName} placeholder="Nombre del hogar (ej: Nuestro nido)" autoCapitalize="sentences" />
        <Button label="Crear hogar" onPress={create} loading={busy === 'create'} disabled={busy !== null} />
      </Card>

      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="smallStrong" tone="subtle">
          o
        </AppText>
        <View style={styles.line} />
      </View>

      <Card style={styles.card}>
        <AppText variant="heading">🔗 Unirme con un código</AppText>
        <AppText variant="small" tone="muted">
          Pídele a tu pareja el código que aparece en la pestaña Hogar.
        </AppText>
        <TextField
          value={code}
          onChangeText={setCode}
          placeholder="HOGAR-XXXXXXXX"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button label="Unirme al hogar" variant="secondary" onPress={join} loading={busy === 'join'} disabled={busy !== null} />
      </Card>

      <Button label="Cerrar sesión" variant="ghost" icon="logout" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  errorBox: { gap: spacing.sm },
  card: { gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
}));
