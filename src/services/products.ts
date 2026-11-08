import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { DEFAULT_CATEGORY } from '@/constants/catalog';
import { createStarterProducts, toStockStatus, type Product } from '@/domain/inventory';
import { asyncStorageCache, LOCAL_SCOPE, type CollectionAdapter } from '@/services/collection';
import { asNullableString, asString } from '@/services/rows';

/** Dónde guardaba la despensa la versión 1.0 de la app (se lee una vez para migrar). */
const LEGACY_FILE = `${FileSystem.documentDirectory}inventory_data.json`;
const LEGACY_KEY = 'INVENTORY_BACKUP';

function sanitizeProduct(value: unknown): Product | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const id = asString(raw.id);
  const name = asString(raw.name).trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    category: asString(raw.category, DEFAULT_CATEGORY) || DEFAULT_CATEGORY,
    status: toStockStatus(raw.status),
    inCart: Boolean(raw.inCart),
    updatedAt: asNullableString(raw.updatedAt),
  };
}

function parseLegacy(json: string | null): Product[] | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const products = parsed.map(sanitizeProduct).filter((product): product is Product => product !== null);
    return products.length ? products : null;
  } catch {
    return null;
  }
}

async function loadLegacyProducts(): Promise<Product[] | null> {
  try {
    const info = await FileSystem.getInfoAsync(LEGACY_FILE);
    if (info.exists) {
      const fromFile = parseLegacy(await FileSystem.readAsStringAsync(LEGACY_FILE));
      if (fromFile) return fromFile;
    }
    return parseLegacy(await AsyncStorage.getItem(LEGACY_KEY));
  } catch (error) {
    console.warn('[products] No se pudo leer la despensa anterior', error);
    return null;
  }
}

export async function deleteLegacyProducts(): Promise<void> {
  try {
    await FileSystem.deleteAsync(LEGACY_FILE, { idempotent: true });
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch (error) {
    console.warn('[products] No se pudo borrar la despensa anterior', error);
  }
}

const cache = asyncStorageCache<Product>('products');

export const productsAdapter: CollectionAdapter<Product> = {
  table: 'products',
  fromRow: row => ({
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category, DEFAULT_CATEGORY) || DEFAULT_CATEGORY,
    status: toStockStatus(row.status),
    inCart: Boolean(row.in_cart),
    updatedAt: asNullableString(row.updated_at),
  }),
  toRow: (product, householdId) => ({
    id: product.id,
    household_id: householdId,
    name: product.name,
    category: product.category,
    status: product.status,
    in_cart: Boolean(product.inCart),
    updated_at: product.updatedAt ?? new Date().toISOString(),
  }),
  ...cache,
  // Sin caché: lo del modo invitado, si no lo de la versión 1.0, si no el catálogo inicial.
  initialItems: async () =>
    (await cache.loadCache(LOCAL_SCOPE))?.items ?? (await loadLegacyProducts()) ?? createStarterProducts(),
};
