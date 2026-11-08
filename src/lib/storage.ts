import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'couple-sync:';

/** Clave con el prefijo de la app: storageKey('household', userId) → "couple-sync:household:<id>". */
export const storageKey = (...parts: string[]) => PREFIX + parts.join(':');

export async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn(`[storage] No se pudo leer ${key}`, error);
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] No se pudo guardar ${key}`, error);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] No se pudo borrar ${key}`, error);
  }
}

/** Borra los datos locales de la app. `keep` decide qué claves conservar. */
export async function clearAppStorage(keep: (key: string) => boolean = () => false): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(key => key.startsWith(PREFIX) && !keep(key));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch (error) {
    console.warn('[storage] No se pudieron limpiar los datos locales', error);
  }
}
