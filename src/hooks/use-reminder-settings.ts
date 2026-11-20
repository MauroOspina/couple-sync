import { useEffect, useSyncExternalStore } from 'react';

import type { ReminderSettings } from '@/domain/reminders';
import { getReminderSettings, loadReminderSettings, subscribeReminderSettings } from '@/services/reminders';

/** Ajustes de recordatorios de este teléfono (se cargan una vez y se comparten). `null` mientras se leen. */
export function useReminderSettings(): ReminderSettings | null {
  useEffect(() => {
    void loadReminderSettings();
  }, []);
  return useSyncExternalStore(subscribeReminderSettings, getReminderSettings, getReminderSettings);
}
