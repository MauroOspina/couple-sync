import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type StockStatus = 'ok' | 'low' | 'out';

export interface Product {
  id: string;
  name: string;
  status: StockStatus;
  inCart?: boolean;
  category: string;
}

const DATA_FILE = FileSystem.documentDirectory + 'inventory_data.json';
const BACKUP_KEY = 'INVENTORY_BACKUP';
const HOUSEHOLD_KEY = 'COUPLE_HOUSEHOLD_ID';
export const DEFAULT_HOUSEHOLD = 'nuestro-hogar';

export const getHouseholdId = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(HOUSEHOLD_KEY);
    return saved && saved.trim().length > 0 ? saved.trim() : DEFAULT_HOUSEHOLD;
  } catch {
    return DEFAULT_HOUSEHOLD;
  }
};

export const setHouseholdId = async (id: string): Promise<void> => {
  const cleanId = id.trim().toLowerCase() || DEFAULT_HOUSEHOLD;
  await AsyncStorage.setItem(HOUSEHOLD_KEY, cleanId);
};

export const loadLocalProducts = async (fallback: Product[]): Promise<Product[]> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DATA_FILE);
    if (fileInfo.exists) {
      const stored = await FileSystem.readAsStringAsync(DATA_FILE);
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const storedAsync = await AsyncStorage.getItem(BACKUP_KEY);
    if (storedAsync) {
      const parsed = JSON.parse(storedAsync);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await FileSystem.writeAsStringAsync(DATA_FILE, storedAsync);
        return parsed;
      }
    }
    return fallback;
  } catch (e) {
    console.warn('⚠️ Error al cargar almacenamiento local:', e);
    return fallback;
  }
};

export const saveLocalProducts = async (products: Product[]): Promise<void> => {
  try {
    const json = JSON.stringify(products);
    await FileSystem.writeAsStringAsync(DATA_FILE, json);
    await AsyncStorage.setItem(BACKUP_KEY, json);
  } catch (e) {
    console.warn('⚠️ Error al guardar en almacenamiento local:', e);
  }
};

export const fetchRemoteProducts = async (householdId: string): Promise<Product[] | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('household_id', householdId);

    if (error) {
      console.warn('⚠️ Error al consultar Supabase:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status as StockStatus,
      inCart: Boolean(item.in_cart),
    }));
  } catch (e) {
    console.warn('⚠️ Fallo de conexión con Supabase:', e);
    return null;
  }
};

export const upsertRemoteProduct = async (product: Product, householdId: string): Promise<void> => {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      household_id: householdId,
      name: product.name,
      category: product.category,
      status: product.status,
      in_cart: Boolean(product.inCart),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('⚠️ Error al sincronizar producto en Supabase:', error.message);
    }
  } catch (e) {
    console.warn('⚠️ Error en upsertRemoteProduct:', e);
  }
};

export const upsertBatchRemoteProducts = async (products: Product[], householdId: string): Promise<void> => {
  if (!isSupabaseConfigured || products.length === 0) return;

  try {
    const rows = products.map(p => ({
      id: p.id,
      household_id: householdId,
      name: p.name,
      category: p.category,
      status: p.status,
      in_cart: Boolean(p.inCart),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').upsert(rows);
    if (error) {
      console.warn('⚠️ Error al sincronizar lote en Supabase:', error.message);
    }
  } catch (e) {
    console.warn('⚠️ Error en upsertBatchRemoteProducts:', e);
  }
};

export const subscribeToHousehold = (
  householdId: string,
  onProductChange: (product: Product) => void
) => {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`couple-products-${householdId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `household_id=eq.${householdId}`,
      },
      payload => {
        if (payload.new && typeof payload.new === 'object') {
          const item = payload.new as any;
          const mappedProduct: Product = {
            id: item.id,
            name: item.name,
            category: item.category,
            status: item.status as StockStatus,
            inCart: Boolean(item.in_cart),
          };
          onProductChange(mappedProduct);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
