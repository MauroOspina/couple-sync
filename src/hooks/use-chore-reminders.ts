import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { planReminders } from '@/domain/reminders';
import { useReminderSettings } from '@/hooks/use-reminder-settings';
import { useChores } from '@/providers/chores-provider';
import { useSession } from '@/providers/session-provider';
import { REMINDER_ROUTE, scheduleReminders } from '@/services/reminders';

/**
 * Mantiene programados los recordatorios de tareas: se recalculan cuando cambian las tareas o la
 * hora elegida, y cada vez que la app vuelve a primer plano (puede haber cambiado el día).
 * Al tocar un aviso se abre la pestaña Tareas.
 */
export function useChoreReminders() {
  const router = useRouter();
  const { user } = useSession();
  const { chores, ready } = useChores();
  const settings = useReminderSettings();
  const [foregrounds, setForegrounds] = useState(0);
  const userId = user?.id ?? null;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') setForegrounds(count => count + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!ready || !settings) return;
    // Espera a que se calmen los cambios (sincronización, varias ediciones seguidas).
    const timer = setTimeout(() => {
      void scheduleReminders(planReminders(chores, userId, new Date(), settings));
    }, 1000);
    return () => clearTimeout(timer);
  }, [chores, ready, userId, settings, foregrounds]);

  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    if (handled.current === key) return;
    handled.current = key;
    if (response.notification.request.content.data?.url === REMINDER_ROUTE) router.navigate(REMINDER_ROUTE);
  }, [response, router]);
}
