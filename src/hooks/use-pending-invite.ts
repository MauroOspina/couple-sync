import { useEffect, useSyncExternalStore } from 'react';

import { getPendingInvite, loadPendingInvite, subscribePendingInvite } from '@/services/pending-invite';

/** Código de invitación pendiente (llegó por link), o `null`. */
export function usePendingInvite(): string | null {
  useEffect(() => {
    void loadPendingInvite();
  }, []);
  return useSyncExternalStore(subscribePendingInvite, getPendingInvite, getPendingInvite);
}
