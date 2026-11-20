import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, View } from 'react-native';

import { AppText, Banner, Button, Card, Chip } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { hourLabel, REMINDER_HOURS } from '@/domain/reminders';
import { makeStyles } from '@/hooks/use-app-theme';
import { useReminderSettings } from '@/hooks/use-reminder-settings';
import {
  getReminderPermission,
  requestReminderPermission,
  saveReminderSettings,
  type ReminderPermission,
} from '@/services/reminders';

/** Recordatorios de tareas de este teléfono: apagados o a una hora del día. */
export function RemindersCard() {
  const styles = useStyles();
  const settings = useReminderSettings();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);

  // El permiso se puede quitar desde Ajustes: se revisa al volver a la app.
  useEffect(() => {
    const check = () => void getReminderPermission().then(setPermission);
    check();
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  if (!settings) return null;

  const choose = async (hour: number | null) => {
    if (hour !== null && !(await requestReminderPermission())) {
      setPermission(await getReminderPermission());
      Alert.alert(
        'Las notificaciones están bloqueadas',
        'Para recibir los recordatorios, permite las notificaciones de Nest en los ajustes del teléfono.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    setPermission(await getReminderPermission());
    await saveReminderSettings({ hour });
  };

  const blocked = settings.hour !== null && permission === 'denied';

  return (
    <Card style={styles.card}>
      <AppText variant="small" tone="muted">
        Un aviso al día con las tareas que te tocan: las tuyas y las de cualquiera.
      </AppText>
      <View style={styles.chips}>
        <Chip label="No" icon="bellOff" selected={settings.hour === null} onPress={() => void choose(null)} />
        {REMINDER_HOURS.map(hour => (
          <Chip
            key={hour}
            label={hourLabel(hour)}
            selected={settings.hour === hour}
            onPress={() => void choose(hour)}
            accessibilityLabel={`Recordar a las ${hourLabel(hour)}`}
          />
        ))}
      </View>
      {blocked ? (
        <>
          <Banner icon="bellOff" message="Las notificaciones de Nest están bloqueadas: no te llegarán los recordatorios." />
          <Button label="Abrir ajustes" icon="bell" variant="secondary" compact onPress={() => void Linking.openSettings()} />
        </>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
}));
