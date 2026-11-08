import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  applyRemoteDelete,
  applyRemoteUpsert,
  confirmDeletes,
  confirmUpserts,
  createCollectionState,
  deleteLocal,
  pendingCount,
  reconcile,
  upsertLocal,
  type CollectionState,
  type SyncedItem,
} from '@/domain/collection';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  deleteRemote,
  fetchRemote,
  LOCAL_SCOPE,
  subscribeRemote,
  upsertRemote,
  type CollectionAdapter,
} from '@/services/collection';

export interface SyncedCollection<T extends SyncedItem> {
  items: T[];
  /** `false` mientras se lee la caché o la primera descarga. */
  ready: boolean;
  /** Cambios guardados en el teléfono que aún no llegan al servidor. */
  pendingCount: number;
  save: (items: T | T[]) => void;
  remove: (id: string) => void;
  refresh: () => Promise<void>;
}

interface SyncSession<T extends SyncedItem> {
  remote: boolean;
  update: (fn: (state: CollectionState<T>) => CollectionState<T>) => void;
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface ViewState<T extends SyncedItem> {
  scope: string | null;
  state: CollectionState<T>;
}

/**
 * Colección local-first: se ve al instante desde la caché, se sincroniza con Supabase en tiempo real
 * y guarda una cola de cambios cuando no hay conexión. Sin hogar (`householdId = null`) solo usa el teléfono.
 */
export function useSyncedCollection<T extends SyncedItem>(
  adapter: CollectionAdapter<T>,
  householdId: string | null,
): SyncedCollection<T> {
  const scope = householdId ?? LOCAL_SCOPE;
  const [view, setView] = useState<ViewState<T>>(() => ({ scope: null, state: createCollectionState<T>() }));
  const sessionRef = useRef<SyncSession<T> | null>(null);

  useEffect(() => {
    const remoteId = isSupabaseConfigured ? householdId : null;
    let alive = true;
    let current = createCollectionState<T>();
    let saveChain: Promise<void> = Promise.resolve();
    let flushing = false;
    let unsubscribe: (() => void) | undefined;

    const commit = (next: CollectionState<T>) => {
      if (!alive) return;
      current = next;
      setView({ scope, state: next });
      saveChain = saveChain
        .then(() => adapter.saveCache(scope, next))
        .catch(error => console.warn(`[${adapter.table}] No se pudo guardar la caché`, error));
    };

    const update = (fn: (state: CollectionState<T>) => CollectionState<T>) => {
      if (!alive) return;
      const next = fn(current);
      if (next !== current) commit(next);
    };

    const flush = async () => {
      if (!remoteId || flushing || !alive) return;
      flushing = true;
      try {
        for (let round = 0; round < 5 && alive; round++) {
          const sent = { ...current.pendingUpserts };
          const toUpsert = current.items.filter(item => sent[item.id] !== undefined);
          const toDelete = [...current.pendingDeletes];
          if (toUpsert.length === 0 && toDelete.length === 0) {
            if (Object.keys(sent).length > 0) update(state => confirmUpserts(state, sent));
            break;
          }
          if (toUpsert.length > 0) {
            await upsertRemote(adapter, toUpsert, remoteId);
            update(state => confirmUpserts(state, sent));
          }
          if (toDelete.length > 0) {
            for (const id of toDelete) await deleteRemote(adapter, id, remoteId);
            update(state => confirmDeletes(state, toDelete));
          }
        }
      } catch (error) {
        console.warn(`[${adapter.table}] Hay cambios pendientes sin sincronizar`, error);
      } finally {
        flushing = false;
      }
    };

    const refresh = async () => {
      if (!remoteId || !alive) return;
      try {
        const rows = await fetchRemote(adapter, remoteId);
        update(state => reconcile(state, rows));
      } catch (error) {
        console.warn(`[${adapter.table}] No se pudo actualizar`, error);
      }
      await flush();
    };

    const session: SyncSession<T> = { remote: remoteId !== null, update, flush, refresh };
    sessionRef.current = session;

    const load = async () => {
      const cached = await adapter.loadCache(scope);
      if (!alive) return;

      if (!remoteId) {
        const initial = cached ?? createCollectionState((await adapter.initialItems?.()) ?? []);
        commit(initial);
        return;
      }

      if (cached) commit(cached);
      unsubscribe = subscribeRemote(adapter, remoteId, {
        onUpsert: item => update(state => applyRemoteUpsert(state, item)),
        onDelete: id => update(state => applyRemoteDelete(state, id)),
      });

      try {
        const rows = await fetchRemote(adapter, remoteId);
        if (!alive) return;
        if (cached) {
          update(state => reconcile(state, rows));
        } else if (rows.length === 0 && adapter.initialItems) {
          // Hogar nuevo: se sube lo que había en el teléfono (o el catálogo inicial).
          const stamp = new Date().toISOString();
          const seed = (await adapter.initialItems()).map(item => ({ ...item, updatedAt: stamp }));
          commit(seed.reduce((state, item) => upsertLocal(state, item, true), createCollectionState<T>()));
        } else {
          commit(createCollectionState(rows));
        }
        await flush();
      } catch (error) {
        console.warn(`[${adapter.table}] Sin conexión, usando datos del teléfono`, error);
        if (!cached) commit(createCollectionState((await adapter.initialItems?.()) ?? []));
      }
    };
    void load();

    // Al volver a la app se recupera lo que pasó mientras estaba en segundo plano.
    const appState = remoteId
      ? AppState.addEventListener('change', status => {
          if (status === 'active') void refresh();
        })
      : null;

    return () => {
      alive = false;
      unsubscribe?.();
      appState?.remove();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [adapter, householdId, scope]);

  const save = useCallback((input: T | T[]) => {
    const session = sessionRef.current;
    const list = Array.isArray(input) ? input : [input];
    if (!session || list.length === 0) return;
    const stamp = new Date().toISOString();
    session.update(state => list.reduce((acc, item) => upsertLocal(acc, { ...item, updatedAt: stamp }, session.remote), state));
    void session.flush();
  }, []);

  const remove = useCallback((id: string) => {
    const session = sessionRef.current;
    if (!session) return;
    session.update(state => deleteLocal(state, id, session.remote));
    void session.flush();
  }, []);

  const refresh = useCallback(async () => {
    await sessionRef.current?.refresh();
  }, []);

  const active = view.scope === scope;
  return {
    items: active ? view.state.items : [],
    ready: active,
    pendingCount: active ? pendingCount(view.state) : 0,
    save,
    remove,
    refresh,
  };
}
