import { toChoreFrequency, type Chore, type ChoreLog } from '@/domain/chores';
import { asyncStorageCache, type CollectionAdapter } from '@/services/collection';
import { asNullableString, asString } from '@/services/rows';

const LOG_WINDOW_DAYS = 90;

const logsSince = () => new Date(Date.now() - LOG_WINDOW_DAYS * 86_400_000).toISOString();

export const choresAdapter: CollectionAdapter<Chore> = {
  table: 'chores',
  fromRow: row => ({
    id: asString(row.id),
    title: asString(row.title),
    emoji: asString(row.emoji, '🧹') || '🧹',
    assignedTo: asNullableString(row.assigned_to),
    frequency: toChoreFrequency(row.frequency),
    dueDate: asNullableString(row.due_date),
    done: Boolean(row.done),
    lastDoneAt: asNullableString(row.last_done_at),
    lastDoneBy: asNullableString(row.last_done_by),
    updatedAt: asNullableString(row.updated_at),
  }),
  toRow: (chore, householdId) => ({
    id: chore.id,
    household_id: householdId,
    title: chore.title,
    emoji: chore.emoji,
    assigned_to: chore.assignedTo,
    frequency: chore.frequency,
    due_date: chore.dueDate,
    done: chore.done,
    last_done_at: chore.lastDoneAt,
    last_done_by: chore.lastDoneBy,
    updated_at: chore.updatedAt ?? new Date().toISOString(),
  }),
  ...asyncStorageCache<Chore>('chores'),
};

const logsCache = asyncStorageCache<ChoreLog>('chore-logs');

export const choreLogsAdapter: CollectionAdapter<ChoreLog> = {
  table: 'chore_logs',
  fromRow: row => ({
    id: asString(row.id),
    choreId: asNullableString(row.chore_id),
    choreTitle: asString(row.chore_title),
    doneBy: asNullableString(row.done_by),
    doneAt: asString(row.done_at),
    updatedAt: asNullableString(row.done_at),
  }),
  toRow: (log, householdId) => ({
    id: log.id,
    household_id: householdId,
    chore_id: log.choreId,
    chore_title: log.choreTitle,
    done_by: log.doneBy,
    done_at: log.doneAt,
  }),
  saveCache: logsCache.saveCache,
  // La caché solo guarda la ventana reciente.
  loadCache: async scope => {
    const state = await logsCache.loadCache(scope);
    if (!state) return null;
    const since = Date.parse(logsSince());
    return { ...state, items: state.items.filter(log => Date.parse(log.doneAt) >= since) };
  },
  fetchSince: { column: 'done_at', value: logsSince },
};
