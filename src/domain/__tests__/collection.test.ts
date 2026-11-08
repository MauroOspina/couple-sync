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
  type SyncedItem,
} from '@/domain/collection';

interface Item extends SyncedItem {
  name: string;
}

const T1 = '2026-11-08T10:00:00.000Z';
const T2 = '2026-11-08T10:00:05.000Z';
const T3 = '2026-11-08T10:00:10.000Z';

const item = (id: string, name: string, updatedAt: string | null = T1): Item => ({ id, name, updatedAt });

describe('collection', () => {
  it('registra cambios locales pendientes solo si hay que sincronizar', () => {
    const base = createCollectionState<Item>();
    expect(pendingCount(upsertLocal(base, item('a', 'Leche'), false))).toBe(0);

    const tracked = upsertLocal(base, item('a', 'Leche', T2), true);
    expect(tracked.pendingUpserts).toEqual({ a: T2 });

    const deleted = deleteLocal(tracked, 'a', true);
    expect(deleted.items).toHaveLength(0);
    expect(deleted.pendingUpserts).toEqual({});
    expect(deleted.pendingDeletes).toEqual(['a']);
  });

  it('ignora ecos remotos más viejos que lo local', () => {
    const state = createCollectionState([item('a', 'Nuevo', T2)]);
    expect(applyRemoteUpsert(state, item('a', 'Viejo', T1))).toBe(state);
  });

  it('limpia el pendiente cuando el servidor confirma (formatos de fecha distintos)', () => {
    const state = upsertLocal(createCollectionState<Item>(), item('a', 'Leche', T2), true);
    const echoed = applyRemoteUpsert(state, item('a', 'Leche', '2026-11-08T10:00:05+00:00'));
    expect(echoed.pendingUpserts).toEqual({});
  });

  it('no resucita lo que se borró localmente', () => {
    const state = deleteLocal(createCollectionState([item('a', 'Leche')]), 'a', true);
    expect(applyRemoteUpsert(state, item('a', 'Leche', T3)).items).toHaveLength(0);
  });

  it('aplica borrados remotos', () => {
    const state = upsertLocal(createCollectionState([item('a', 'Leche')]), item('a', 'Leche', T2), true);
    const next = applyRemoteDelete(state, 'a');
    expect(next.items).toHaveLength(0);
    expect(next.pendingUpserts).toEqual({});
  });

  it('reconcilia: gana el servidor salvo pendientes más nuevos', () => {
    let state = createCollectionState([item('a', 'A local', T1), item('b', 'B local', T1)]);
    state = upsertLocal(state, item('b', 'B editado', T3), true);
    state = upsertLocal(state, item('c', 'C offline', T3), true);
    state = upsertLocal(state, item('d', 'D editado', T1), true);
    state = upsertLocal(state, item('e', 'E', T1), true);
    state = deleteLocal(state, 'e', true);

    const remote = [item('a', 'A remoto', T2), item('b', 'B remoto', T2), item('d', 'D remoto', T2), item('e', 'E', T1)];
    const next = reconcile(state, remote);
    const names = Object.fromEntries(next.items.map(entry => [entry.id, entry.name]));

    expect(names).toEqual({ a: 'A remoto', b: 'B editado', c: 'C offline', d: 'D remoto' });
    expect(Object.keys(next.pendingUpserts).sort()).toEqual(['b', 'c']);
    expect(next.pendingDeletes).toEqual(['e']);
  });

  it('confirma solo los envíos que no cambiaron en el camino', () => {
    let state = upsertLocal(createCollectionState<Item>(), item('a', 'Leche', T1), true);
    const sent = { ...state.pendingUpserts };
    state = upsertLocal(state, item('a', 'Leche entera', T2), true);
    expect(confirmUpserts(state, sent).pendingUpserts).toEqual({ a: T2 });

    const deleted = deleteLocal(state, 'a', true);
    expect(confirmDeletes(deleted, ['a']).pendingDeletes).toEqual([]);
  });
});
