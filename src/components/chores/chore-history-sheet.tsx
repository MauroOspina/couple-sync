import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button, Chip, EmptyState, IconButton, Sheet } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { CHORE_LOG_WINDOW_DAYS, choreHistory, nextMemberId, type ChoreLog } from '@/domain/chores';
import { formatDayLabel, formatTime, todayISO } from '@/domain/dates';
import { makeStyles } from '@/hooks/use-app-theme';
import { useChores } from '@/providers/chores-provider';
import { useSession } from '@/providers/session-provider';

const PAGE_SIZE = 40;

interface ChoreHistorySheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Tareas hechas, día por día. Permite corregir quién la hizo o borrar un registro equivocado. */
export function ChoreHistorySheet({ visible, onClose }: ChoreHistorySheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Historial">
      {visible ? <HistoryContent /> : null}
    </Sheet>
  );
}

function HistoryContent() {
  const styles = useStyles();
  const { chores, logs, setLogDoneBy, deleteLog } = useChores();
  const { members, memberName } = useSession();
  // `undefined` = todas las personas.
  const [doneBy, setDoneBy] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const today = todayISO();

  const history = useMemo(() => choreHistory(logs, { doneBy, limit }), [logs, doneBy, limit]);
  const emojiById = useMemo(() => new Map(chores.map(chore => [chore.id, chore.emoji])), [chores]);
  const memberIds = members.map(member => member.userId);
  const shared = members.length > 1;
  const nameOf = (userId: string | null) => (userId ? memberName(userId) : 'Alguien');

  const filterBy = (value: string | undefined) => {
    setDoneBy(value);
    setLimit(PAGE_SIZE);
  };

  const confirmDelete = (log: ChoreLog) => {
    Alert.alert('¿Borrar este registro?', `"${log.choreTitle}" ya no contará en el historial ni en las estadísticas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => deleteLog(log.id) },
    ]);
  };

  return (
    <>
      <AppText variant="small" tone="muted">
        Últimos {CHORE_LOG_WINDOW_DAYS} días · {history.total} {history.total === 1 ? 'tarea hecha' : 'tareas hechas'}
      </AppText>

      {shared ? (
        <View style={styles.chips}>
          <Chip label="Todos" icon="group" selected={doneBy === undefined} onPress={() => filterBy(undefined)} />
          {members.map(member => (
            <Chip
              key={member.userId}
              label={memberName(member.userId)}
              icon="person"
              selected={doneBy === member.userId}
              onPress={() => filterBy(member.userId)}
            />
          ))}
        </View>
      ) : null}

      {history.total === 0 ? (
        <EmptyState emoji="🗓️" title="Nada por aquí" message="Cuando marquen tareas como hechas, aparecerán aquí con su fecha." />
      ) : null}

      {history.days.map(({ day, logs: dayLogs }) => (
        <View key={day} style={styles.day}>
          <View style={styles.dayHeader}>
            <AppText variant="label" tone="muted">
              {formatDayLabel(day, today)}
            </AppText>
            <AppText variant="caption" tone="subtle">
              {dayLogs.length}
            </AppText>
          </View>
          {dayLogs.map(log => (
            <View key={log.id} style={styles.row}>
              <AppText style={styles.emoji}>{(log.choreId && emojiById.get(log.choreId)) || '✅'}</AppText>
              <View style={styles.texts}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {log.choreTitle}
                </AppText>
                <AppText variant="caption" tone="subtle">
                  {formatTime(log.doneAt)}
                  {shared ? '' : ` · ${nameOf(log.doneBy)}`}
                </AppText>
              </View>
              {shared ? (
                <Chip
                  label={nameOf(log.doneBy)}
                  icon="person"
                  accessibilityLabel={`La hizo ${nameOf(log.doneBy)}. Toca para cambiar`}
                  onPress={() => setLogDoneBy(log.id, nextMemberId(memberIds, log.doneBy))}
                />
              ) : null}
              <IconButton
                icon="delete"
                variant="plain"
                size={36}
                accessibilityLabel={`Borrar registro de "${log.choreTitle}"`}
                onPress={() => confirmDelete(log)}
              />
            </View>
          ))}
        </View>
      ))}

      {history.total > limit ? (
        <Button label="Ver más" variant="secondary" onPress={() => setLimit(value => value + PAGE_SIZE)} />
      ) : null}
    </>
  );
}

const useStyles = makeStyles(theme => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { gap: spacing.sm },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  emoji: { fontSize: 22, lineHeight: 28 },
  texts: { flex: 1 },
}));
