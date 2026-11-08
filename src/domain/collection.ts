/**
 * Estado de una colección sincronizada (productos, tareas, recetas...).
 * Funciones puras: el hook `useSyncedCollection` las usa para aplicar cambios locales y remotos
 * y para recordar qué cambios faltan por enviar cuando no hay conexión.
 */
export interface SyncedItem {
  id: string;
  /** ISO del último cambio. Sirve para descartar ecos viejos de la base de datos. */
  updatedAt?: string | null;
}

export interface CollectionState<T extends SyncedItem> {
  items: T[];
  /** Cambios locales sin confirmar: id → `updatedAt` que se envió. */
  pendingUpserts: Record<string, string>;
  /** Borrados locales sin confirmar. */
  pendingDeletes: string[];
}

export function createCollectionState<T extends SyncedItem>(items: T[] = []): CollectionState<T> {
  return { items, pendingUpserts: {}, pendingDeletes: [] };
}

export function isCollectionState<T extends SyncedItem>(value: unknown): value is CollectionState<T> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CollectionState<T>>;
  return (
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.pendingDeletes) &&
    typeof candidate.pendingUpserts === 'object' &&
    candidate.pendingUpserts !== null
  );
}

function isOlder(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return Date.parse(a) < Date.parse(b);
}

function replaceOrPrepend<T extends SyncedItem>(items: T[], item: T): T[] {
  const index = items.findIndex(existing => existing.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function withoutKey(record: Record<string, string>, key: string): Record<string, string> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

/** Cambio hecho en este teléfono. `track` = hay que enviarlo al servidor. */
export function upsertLocal<T extends SyncedItem>(state: CollectionState<T>, item: T, track: boolean): CollectionState<T> {
  const items = replaceOrPrepend(state.items, item);
  if (!track) return { ...state, items };
  return {
    items,
    pendingUpserts: { ...state.pendingUpserts, [item.id]: item.updatedAt ?? '' },
    pendingDeletes: state.pendingDeletes.filter(id => id !== item.id),
  };
}

export function deleteLocal<T extends SyncedItem>(state: CollectionState<T>, id: string, track: boolean): CollectionState<T> {
  const items = state.items.filter(item => item.id !== id);
  if (!track) return { ...state, items };
  return {
    items,
    pendingUpserts: withoutKey(state.pendingUpserts, id),
    pendingDeletes: state.pendingDeletes.includes(id) ? state.pendingDeletes : [...state.pendingDeletes, id],
  };
}

/** Cambio que llegó en tiempo real desde el servidor (puede ser el eco de uno nuestro). */
export function applyRemoteUpsert<T extends SyncedItem>(state: CollectionState<T>, item: T): CollectionState<T> {
  if (state.pendingDeletes.includes(item.id)) return state;
  const current = state.items.find(existing => existing.id === item.id);
  if (current && isOlder(item.updatedAt, current.updatedAt)) return state;

  const pendingStamp = state.pendingUpserts[item.id];
  const caughtUp = pendingStamp !== undefined && !isOlder(item.updatedAt, pendingStamp);
  return {
    ...state,
    items: replaceOrPrepend(state.items, item),
    pendingUpserts: caughtUp ? withoutKey(state.pendingUpserts, item.id) : state.pendingUpserts,
  };
}

export function applyRemoteDelete<T extends SyncedItem>(state: CollectionState<T>, id: string): CollectionState<T> {
  return {
    items: state.items.filter(item => item.id !== id),
    pendingUpserts: withoutKey(state.pendingUpserts, id),
    pendingDeletes: state.pendingDeletes.filter(pending => pending !== id),
  };
}

/**
 * Mezcla la lista completa del servidor con lo local.
 * Gana el servidor, salvo cambios locales pendientes que sean más nuevos.
 */
export function reconcile<T extends SyncedItem>(state: CollectionState<T>, remote: T[]): CollectionState<T> {
  const deleted = new Set(state.pendingDeletes);
  const localById = new Map(state.items.map(item => [item.id, item]));
  let pendingUpserts = state.pendingUpserts;
  const seen = new Set<string>();
  const items: T[] = [];

  for (const remoteItem of remote) {
    if (deleted.has(remoteItem.id)) continue;
    seen.add(remoteItem.id);
    const local = localById.get(remoteItem.id);
    const hasPending = pendingUpserts[remoteItem.id] !== undefined;
    if (local && hasPending && !isOlder(local.updatedAt, remoteItem.updatedAt)) {
      items.push(local);
    } else {
      items.push(remoteItem);
      if (hasPending) pendingUpserts = withoutKey(pendingUpserts, remoteItem.id);
    }
  }

  for (const id of Object.keys(pendingUpserts)) {
    const local = localById.get(id);
    if (!seen.has(id) && local) items.push(local);
  }

  return { ...state, items, pendingUpserts };
}

/** Limpia los pendientes enviados, salvo los que se volvieron a modificar mientras viajaban. */
export function confirmUpserts<T extends SyncedItem>(state: CollectionState<T>, sent: Record<string, string>): CollectionState<T> {
  let pendingUpserts = state.pendingUpserts;
  for (const [id, stamp] of Object.entries(sent)) {
    if (pendingUpserts[id] === stamp) pendingUpserts = withoutKey(pendingUpserts, id);
  }
  return pendingUpserts === state.pendingUpserts ? state : { ...state, pendingUpserts };
}

export function confirmDeletes<T extends SyncedItem>(state: CollectionState<T>, ids: string[]): CollectionState<T> {
  if (ids.length === 0) return state;
  const confirmed = new Set(ids);
  return { ...state, pendingDeletes: state.pendingDeletes.filter(id => !confirmed.has(id)) };
}

export function pendingCount<T extends SyncedItem>(state: CollectionState<T>): number {
  return Object.keys(state.pendingUpserts).length + state.pendingDeletes.length;
}
