/**
 * Invitaciones con link. El link público es `join.html#CODIGO` (GitHub Pages) y abre la app con
 * `couplesync://join?code=CODIGO`. La validación es flexible a propósito: hay hogares viejos con
 * códigos como "HOGAR-1234"; el servidor (`join_household`) es quien decide si el código existe.
 */

/** Pasa el código a mayúsculas y quita espacios. `null` si no parece un código (solo letras, números y guiones). */
export function normalizeInviteCode(value: string): string | null {
  const code = value.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9-]{4,24}$/.test(code) ? code : null;
}

/** Mismo hogar: el servidor acepta el código con o sin el prefijo "HOGAR-". */
export function sameInviteCode(a: string, b: string): boolean {
  const strip = (code: string) => code.trim().toUpperCase().replace(/^HOGAR-/, '');
  return strip(a) === strip(b);
}

/**
 * Lee el código de un link de invitación: `couplesync://join?code=X`, `/join?code=X` o, en Expo Go,
 * `exp://host/--/join?code=X`. Cualquier otro link (login de Google, "Compartir → Nest") da `null`.
 */
export function parseInviteLink(url: string): string | null {
  let rest = url.trim();
  const expoGo = rest.indexOf('/--/');
  if (expoGo >= 0) rest = rest.slice(expoGo + 4);
  else rest = rest.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');

  const [path, query = ''] = rest.split('#')[0].split('?');
  if (path.replace(/^\/+|\/+$/g, '').toLowerCase() !== 'join') return null;

  const match = /(?:^|&)code=([^&]*)/.exec(query);
  if (!match) return null;
  try {
    return normalizeInviteCode(decodeURIComponent(match[1].replace(/\+/g, ' ')));
  } catch {
    return null;
  }
}

/** Link público para compartir: el código va después de `#`, así nunca llega al servidor de la página. */
export function inviteLink(pageUrl: string, code: string): string {
  return `${pageUrl}#${encodeURIComponent(code)}`;
}

/** Mensaje para compartir por WhatsApp, etc.: el link y, por si acaso, el código. */
export function inviteMessage(householdName: string, appName: string, link: string, code: string): string {
  return (
    `¡Únete a nuestro hogar "${householdName}" en ${appName}! Abre este link para entrar:\n${link}\n\n` +
    `Si no abre, inicia sesión en ${appName} y escribe el código ${code}`
  );
}
