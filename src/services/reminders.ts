import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { toReminderSettings, type PlannedReminder, type ReminderSettings } from '@/domain/reminders';
import { readJSON, storageKey, writeJSON } from '@/lib/storage';

/**
 * Recordatorios de tareas: notificaciones locales que programa el propio teléfono (sin servidor).
 * Los ajustes son de cada teléfono. Ver `domain/reminders.ts` para qué se avisa y cuándo.
 */
const CHANNEL_ID = 'recordatorios';
/** Termina en `:local` para que cerrar sesión no borre la hora elegida (ver `signOut`). */
const SETTINGS_KEY = storageKey('reminders', 'local');
/** Ruta que abre la app al tocar el aviso. */
export const REMINDER_ROUTE = '/tareas';

// Con la app abierta, el aviso se muestra igual (sin sonido).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** `null` hasta leer lo guardado: así no se borran los avisos antes de saber la hora elegida. */
let settings: ReminderSettings | null = null;
const listeners = new Set<() => void>();

export function getReminderSettings(): ReminderSettings | null {
  return settings;
}

export function subscribeReminderSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setSettings(value: ReminderSettings) {
  settings = value;
  listeners.forEach(listener => listener());
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  if (settings) return settings;
  const stored = await readJSON<unknown>(SETTINGS_KEY);
  const value = settings ?? toReminderSettings(stored);
  if (!settings) setSettings(value);
  return value;
}

export async function saveReminderSettings(value: ReminderSettings): Promise<void> {
  setSettings(value);
  await writeJSON(SETTINGS_KEY, value);
}

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export async function getReminderPermission(): Promise<ReminderPermission> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/** Pide permiso para notificar (Android 13+ muestra el diálogo una o dos veces; luego hay que ir a Ajustes). */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    if (!current.canAskAgain) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('[reminders] No se pudo pedir permiso', error);
    return false;
  }
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios de tareas',
    description: 'Un aviso al día con las tareas del hogar que te tocan.',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Reemplaza los avisos programados por estos. Una lista vacía los borra todos. */
export async function scheduleReminders(reminders: PlannedReminder[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (reminders.length === 0) return;
    if ((await getReminderPermission()) !== 'granted') return;
    await ensureChannel();
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        identifier: `chores-${reminder.day}`,
        content: { title: reminder.title, body: reminder.body, data: { url: REMINDER_ROUTE } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: CHANNEL_ID },
      });
    }
  } catch (error) {
    console.warn('[reminders] No se pudieron programar los recordatorios', error);
  }
}

/** Al cerrar sesión, salir del hogar o borrar la cuenta: que no lleguen avisos de un hogar que ya no se ve. */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sin el módulo nativo (Expo Go viejo, web) no hay nada que cancelar.
  }
}
