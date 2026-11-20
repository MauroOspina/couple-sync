import { useEffect } from 'react';
import { Alert } from 'react-native';

import { sameInviteCode } from '@/domain/invite';
import { usePendingInvite } from '@/hooks/use-pending-invite';
import { useSession } from '@/providers/session-provider';
import { clearPendingInvite } from '@/services/pending-invite';

/**
 * Llega un link de invitación cuando la persona ya está en las pestañas. Sin hogar, lo atienden
 * el login y la pantalla de crear/unirse; aquí solo se cubren el modo local y "ya tienes hogar".
 */
export function useInviteWhileReady() {
  const { status, household, isGuest, exitGuestMode } = useSession();
  const invite = usePendingInvite();

  useEffect(() => {
    if (status !== 'ready' || !invite) return;

    if (isGuest) {
      Alert.alert('Te invitaron a un hogar', 'Para unirte, inicia sesión con Google.', [
        { text: 'Ahora no', style: 'cancel', onPress: () => void clearPendingInvite() },
        { text: 'Iniciar sesión', onPress: () => void exitGuestMode() },
      ]);
      return;
    }

    void clearPendingInvite();
    if (household && !sameInviteCode(household.inviteCode, invite)) {
      Alert.alert(
        'Ya estás en un hogar',
        `Estás en "${household.name}". Para unirte al otro hogar, primero sal de este en la pestaña Hogar y vuelve a abrir el link.`,
      );
    }
  }, [status, invite, isGuest, household, exitGuestMode]);
}
