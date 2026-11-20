import { Share } from 'react-native';

import { APP_CONFIG } from '@/constants/config';
import { inviteLink, inviteMessage } from '@/domain/invite';
import type { Household } from '@/services/households';

/** Abre "Compartir" con el link de invitación al hogar (y el código, por si el link no abre). */
export function shareInvite(household: Pick<Household, 'name' | 'inviteCode'>): void {
  const link = inviteLink(APP_CONFIG.links.join, household.inviteCode);
  void Share.share({ message: inviteMessage(household.name, APP_CONFIG.name, link, household.inviteCode) });
}
