import { useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';

import { ChoreEditorSheet } from '@/components/chores/chore-editor-sheet';
import { ChoreHistorySheet } from '@/components/chores/chore-history-sheet';
import { ChoreRow } from '@/components/chores/chore-row';
import { ChoreStatsCard } from '@/components/chores/chore-stats-card';
import { CompletionSnackbar } from '@/components/chores/completion-snackbar';
import { Button, EmptyState, IconButton, LoadingView, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { groupChores, type Chore } from '@/domain/chores';
import { todayISO } from '@/domain/dates';
import { makeStyles } from '@/hooks/use-app-theme';
import { useChores, type ChoreCompletion } from '@/providers/chores-provider';
import { useSession } from '@/providers/session-provider';

const DONE_VISIBLE = 15;
/** Tiempo que se ve el aviso para deshacer. Se reinicia al cambiar quién la hizo. */
const SNACKBAR_MS = 6000;

/** Tareas del hogar: para hoy, próximas, sin fecha y hechas. */
export default function ChoresScreen() {
  const styles = useStyles();
  const { chores, logs, ready, completeChore, undoCompletion, reopenChore, setLogDoneBy } = useChores();
  const { household, members, memberName } = useSession();
  const [editor, setEditor] = useState<{ chore: Chore | null } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [completion, setCompletion] = useState<ChoreCompletion | null>(null);
  const today = todayISO();

  useEffect(() => {
    if (!completion) return;
    const timer = setTimeout(() => setCompletion(null), SNACKBAR_MS);
    return () => clearTimeout(timer);
  }, [completion]);

  const groups = useMemo(() => groupChores(chores, today), [chores, today]);
  const sections = useMemo(
    () =>
      [
        { key: 'today', title: 'Para hoy', data: groups.today },
        { key: 'upcoming', title: 'Próximas', data: groups.upcoming },
        { key: 'someday', title: 'Sin fecha', data: groups.someday },
        { key: 'done', title: 'Hechas', data: groups.done.slice(0, DONE_VISIBLE) },
      ].filter(section => section.data.length > 0),
    [groups],
  );

  if (!ready) return <LoadingView />;

  const shared = members.length > 1;
  const openNew = () => setEditor({ chore: null });

  const toggle = (chore: Chore) => {
    if (chore.done) {
      reopenChore(chore.id);
      return;
    }
    setCompletion(completeChore(chore.id));
  };

  const undo = () => {
    if (completion) undoCompletion(completion);
    setCompletion(null);
  };

  const changeDoneBy = (userId: string) => {
    if (!completion) return;
    setLogDoneBy(completion.logId, userId);
    setCompletion({ ...completion, doneBy: userId });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Tareas"
        subtitle={groups.today.length ? `${groups.today.length} para hoy` : 'Nada pendiente para hoy'}
        right={
          <View style={styles.headerActions}>
            <IconButton icon="history" accessibilityLabel="Historial de tareas hechas" onPress={() => setHistoryOpen(true)} />
            <IconButton icon="add" variant="primary" accessibilityLabel="Nueva tarea" onPress={openNew} />
          </View>
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={chore => chore.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={household ? <ChoreStatsCard logs={logs} members={members} memberName={memberName} /> : null}
        renderSectionHeader={({ section }) => <SectionTitle title={section.title} />}
        renderItem={({ item }) => (
          <ChoreRow
            chore={item}
            today={today}
            assigneeName={shared || item.assignedTo ? memberName(item.assignedTo) : null}
            onToggle={() => toggle(item)}
            onEdit={() => setEditor({ chore: item })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🧹"
            title="Sin tareas todavía"
            message="Repartan las tareas de la casa: quién saca la basura, quién riega las plantas, quién lava los platos...">
            <Button label="Crear la primera tarea" icon="add" onPress={openNew} />
          </EmptyState>
        }
      />

      {completion ? (
        <CompletionSnackbar
          completion={completion}
          members={members}
          memberName={memberName}
          onUndo={undo}
          onChangeDoneBy={changeDoneBy}
        />
      ) : null}

      <ChoreEditorSheet visible={editor !== null} chore={editor?.chore ?? null} onClose={() => setEditor(null)} />
      <ChoreHistorySheet visible={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(() => ({
  // Espacio extra abajo para que el aviso de deshacer no tape la última tarea.
  list: { paddingHorizontal: spacing.lg, paddingBottom: 140 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
}));
