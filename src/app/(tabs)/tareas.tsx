import { useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';

import { ChoreEditorSheet } from '@/components/chores/chore-editor-sheet';
import { ChoreRow } from '@/components/chores/chore-row';
import { ChoreStatsCard } from '@/components/chores/chore-stats-card';
import { Button, EmptyState, IconButton, LoadingView, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { groupChores, type Chore } from '@/domain/chores';
import { todayISO } from '@/domain/dates';
import { makeStyles } from '@/hooks/use-app-theme';
import { useChores } from '@/providers/chores-provider';
import { useSession } from '@/providers/session-provider';

const DONE_VISIBLE = 15;

/** Tareas del hogar: para hoy, próximas, sin fecha y hechas. */
export default function ChoresScreen() {
  const styles = useStyles();
  const { chores, logs, ready, completeChore, reopenChore } = useChores();
  const { household, members, memberName } = useSession();
  const [editor, setEditor] = useState<{ chore: Chore | null } | null>(null);
  const today = todayISO();

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

  return (
    <Screen>
      <ScreenHeader
        title="Tareas"
        subtitle={groups.today.length ? `${groups.today.length} para hoy` : 'Nada pendiente para hoy'}
        right={<IconButton icon="add" variant="primary" accessibilityLabel="Nueva tarea" onPress={openNew} />}
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
            onToggle={() => (item.done ? reopenChore(item.id) : completeChore(item.id))}
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

      <ChoreEditorSheet visible={editor !== null} chore={editor?.chore ?? null} onClose={() => setEditor(null)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(() => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
}));
