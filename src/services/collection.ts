import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { isCollectionState, type CollectionState, type SyncedItem } from '@/domain/collection';
import { readJSON, storageKey, writeJSON } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export type Row = Record<string, unknown>;

/** Alcance de la caché cuando no hay hogar (modo invitado). */
export const LOCAL_SCOPE = 'local';

/**
 * Describe cómo se guarda una colección en Supabase y en el teléfono.
 * La tabla debe tener columnas `id` y `household_id` (ver supabase/schema.sql).
 */
export interface CollectionAdapter<T extends SyncedItem> {
  table: string;
  fromRow: (row: Row) => T;
  toRow: (item: T, householdId: string) => Row;
  loadCache: (scope: string) => Promise<CollectionState<T> | null>;
  saveCache: (scope: string, state: CollectionState<T>) => Promise<void>;
  /** Datos de arranque cuando no hay caché. En un hogar nuevo se suben al servidor. */
  initialItems?: () => Promise<T[]>;
  /** Limita la descarga inicial (p. ej. solo registros recientes). */
  fetchSince?: { column: string; value: () => string };
}

/** Caché en AsyncStorage por alcance (hogar o modo local). */
export function asyncStorageCache<T extends SyncedItem>(name: string) {
  return {
    loadCache: async (scope: string) => {
      const value = await readJSON<unknown>(storageKey(name, scope));
      return isCollectionState<T>(value) ? value : null;
    },
    saveCache: (scope: string, state: CollectionState<T>) => writeJSON(storageKey(name, scope), state),
  };
}

export async function fetchRemote<T extends SyncedItem>(adapter: CollectionAdapter<T>, householdId: string): Promise<T[]> {
  let query = supabase.from(adapter.table).select('*').eq('household_id', householdId);
  if (adapter.fetchSince) query = query.gte(adapter.fetchSince.column, adapter.fetchSince.value());
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(row => adapter.fromRow(row as Row));
}

export async function upsertRemote<T extends SyncedItem>(
  adapter: CollectionAdapter<T>,
  items: T[],
  householdId: string,
): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from(adapter.table).upsert(items.map(item => adapter.toRow(item, householdId)));
  if (error) throw error;
}

export async function deleteRemote<T extends SyncedItem>(
  adapter: CollectionAdapter<T>,
  id: string,
  householdId: string,
): Promise<void> {
  const { error } = await supabase.from(adapter.table).delete().eq('id', id).eq('household_id', householdId);
  if (error) throw error;
}

/** Escucha cambios en tiempo real del hogar. Devuelve la función para dejar de escuchar. */
export function subscribeRemote<T extends SyncedItem>(
  adapter: CollectionAdapter<T>,
  householdId: string,
  handlers: { onUpsert: (item: T) => void; onDelete: (id: string) => void },
): () => void {
  const channel = supabase
    .channel(`${adapter.table}:${householdId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: adapter.table, filter: `household_id=eq.${householdId}` },
      (payload: RealtimePostgresChangesPayload<Row>) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old?.id;
          if (typeof id === 'string') handlers.onDelete(id);
        } else if (payload.new) {
          handlers.onUpsert(adapter.fromRow(payload.new));
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
