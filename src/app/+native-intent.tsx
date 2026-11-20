import { parseInviteLink } from '@/domain/invite';
import { savePendingInvite } from '@/services/pending-invite';

/**
 * Links que abren la app desde afuera. Una invitación (`couplesync://join?code=...`) se guarda y
 * se abre el inicio: la pantalla que toque (login, crear/unirse o pestañas) la atiende.
 * Todo lo demás (login de Google, "Compartir → Nest") sigue igual.
 */
export async function redirectSystemPath({ path }: { path: string; initial: boolean }): Promise<string> {
  try {
    const code = parseInviteLink(path);
    if (!code) return path;
    await savePendingInvite(code);
    return '/';
  } catch {
    return path;
  }
}
