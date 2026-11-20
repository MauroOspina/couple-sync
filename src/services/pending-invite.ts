import { readJSON, removeKey, storageKey, writeJSON } from '@/lib/storage';

/**
 * Código de invitación que llegó por link y aún no se usa. Se guarda en el teléfono para que
 * sobreviva al login con Google, y avisa a quien escuche (la app puede estar abierta).
 */
const KEY = storageKey('pending-invite');
/** Una invitación vieja no debería aparecer semanas después. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredInvite {
  code: string;
  savedAt: number;
}

let current: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function set(code: string | null) {
  current = code;
  loaded = true;
  listeners.forEach(listener => listener());
}

export function getPendingInvite(): string | null {
  return current;
}

export async function loadPendingInvite(): Promise<string | null> {
  if (loaded) return current;
  const stored = await readJSON<StoredInvite>(KEY);
  if (loaded) return current; // llegó un link mientras se leía
  const fresh = stored && typeof stored.code === 'string' && Date.now() - stored.savedAt < MAX_AGE_MS;
  set(fresh ? stored.code : null);
  return current;
}

export async function savePendingInvite(code: string): Promise<void> {
  set(code);
  await writeJSON(KEY, { code, savedAt: Date.now() } satisfies StoredInvite);
}

export async function clearPendingInvite(): Promise<void> {
  set(null);
  await removeKey(KEY);
}

export function subscribePendingInvite(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
