/** Un APK nuevo publicado para un canal (preview o production). */
export interface AppUpdateInfo {
  version: string;
  /** Link de descarga del APK (https). */
  url: string;
  /** Qué trae, para mostrar en el aviso. Puede ir vacío. */
  notes: string;
}

/** Compara versiones "1.2.10" numéricamente. Negativo si a < b, 0 si son iguales, positivo si a > b. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(part => parseInt(part, 10) || 0);
  const right = b.split('.').map(part => parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Lee `docs/app-update.json` ({ "<canal>": { version, url, notes } }) y devuelve el APK del canal
 * si es más nuevo que la versión instalada. Cualquier dato raro o incompleto se ignora (devuelve null).
 */
export function findAppUpdate(manifest: unknown, channel: string | null, installedVersion: string | null): AppUpdateInfo | null {
  if (!channel || !installedVersion || !manifest || typeof manifest !== 'object') return null;
  const entry = (manifest as Record<string, unknown>)[channel];
  if (!entry || typeof entry !== 'object') return null;
  const { version, url, notes } = entry as Record<string, unknown>;
  if (typeof version !== 'string' || typeof url !== 'string' || !url.startsWith('https://')) return null;
  if (compareVersions(version, installedVersion) <= 0) return null;
  return { version, url, notes: typeof notes === 'string' ? notes.trim() : '' };
}
