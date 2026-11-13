import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { completeChore, isDue, lastCompletionLog, type Chore, type ChoreLog } from '@/domain/chores';
import { todayISO } from '@/domain/dates';
import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createId } from '@/lib/id';
import { useSession } from '@/providers/session-provider';
import { choreLogsAdapter, choresAdapter } from '@/services/chores';

export type ChoreDraft = Pick<Chore, 'title' | 'emoji' | 'assignedTo' | 'frequency' | 'repeatEvery' | 'weekdays' | 'dueDate'>;

/** Lo necesario para deshacer una tarea recién completada o cambiar quién la hizo. */
export interface ChoreCompletion {
  logId: string;
  doneBy: string | null;
  /** La tarea tal como estaba antes de completarla. */
  previous: Chore;
}

interface ChoresContextValue {
  chores: Chore[];
  logs: ChoreLog[];
  ready: boolean;
  /** Tareas para hoy o atrasadas. */
  dueCount: number;
  /** Crea la tarea, o la actualiza si se pasa `id`. */
  saveChore: (draft: ChoreDraft, id?: string) => void;
  deleteChore: (id: string) => void;
  /** Completa la tarea a nombre de quien la marca. Devuelve con qué deshacerla. */
  completeChore: (id: string) => ChoreCompletion | null;
  /** Deja la tarea como estaba (también las repetitivas) y borra su registro. */
  undoCompletion: (completion: ChoreCompletion) => void;
  /** Vuelve a dejar pendiente una tarea de una vez y borra su registro. */
  reopenChore: (id: string) => void;
  /** Cambia quién hizo una tarea del historial. */
  setLogDoneBy: (logId: string, userId: string | null) => void;
  /** Borra un registro del historial. Si era el de una tarea de una vez, la reabre. */
  deleteLog: (logId: string) => void;
}

const ChoresContext = createContext<ChoresContextValue | null>(null);

export function ChoresProvider({ children }: PropsWithChildren) {
  const { household, user } = useSession();
  const householdId = household?.id ?? null;
  const {
    items: chores,
    ready: choresReady,
    save: saveChoreItem,
    remove: removeChore,
  } = useSyncedCollection(choresAdapter, householdId);
  const {
    items: logs,
    ready: logsReady,
    save: saveLog,
    remove: removeLog,
  } = useSyncedCollection(choreLogsAdapter, householdId);
  const userId = user?.id ?? null;

  const value = useMemo<ChoresContextValue>(() => {
    const byId = (id: string) => chores.find(chore => chore.id === id);
    const today = todayISO();
    return {
      chores,
      logs,
      ready: choresReady && logsReady,
      dueCount: chores.filter(chore => isDue(chore, today)).length,
      saveChore: (draft, id) => {
        const existing = id ? byId(id) : undefined;
        saveChoreItem(
          existing
            ? { ...existing, ...draft }
            : { id: createId(), ...draft, done: false, lastDoneAt: null, lastDoneBy: null },
        );
      },
      deleteChore: id => removeChore(id),
      completeChore: id => {
        const chore = byId(id);
        if (!chore) return null;
        const now = new Date().toISOString();
        const logId = createId();
        saveChoreItem(completeChore(chore, userId, todayISO(), now));
        saveLog({ id: logId, choreId: chore.id, choreTitle: chore.title, doneBy: userId, doneAt: now });
        return { logId, doneBy: userId, previous: chore };
      },
      undoCompletion: ({ logId, previous }) => {
        if (byId(previous.id)) saveChoreItem(previous);
        removeLog(logId);
      },
      reopenChore: id => {
        const chore = byId(id);
        if (!chore) return;
        saveChoreItem({ ...chore, done: false });
        const log = lastCompletionLog(chore, logs);
        if (log) removeLog(log.id);
      },
      setLogDoneBy: (logId, doneBy) => {
        const log = logs.find(item => item.id === logId);
        if (!log || log.doneBy === doneBy) return;
        saveLog({ ...log, doneBy });
        const chore = log.choreId ? byId(log.choreId) : undefined;
        if (chore && lastCompletionLog(chore, [log])) saveChoreItem({ ...chore, lastDoneBy: doneBy });
      },
      deleteLog: logId => {
        const log = logs.find(item => item.id === logId);
        if (!log) return;
        removeLog(logId);
        const chore = log.choreId ? byId(log.choreId) : undefined;
        if (chore?.frequency === 'once' && chore.done && lastCompletionLog(chore, [log])) {
          saveChoreItem({ ...chore, done: false });
        }
      },
    };
  }, [chores, logs, choresReady, logsReady, saveChoreItem, removeChore, saveLog, removeLog, userId]);

  return <ChoresContext.Provider value={value}>{children}</ChoresContext.Provider>;
}

export function useChores(): ChoresContextValue {
  const context = useContext(ChoresContext);
  if (!context) throw new Error('useChores debe usarse dentro de <ChoresProvider>');
  return context;
}
