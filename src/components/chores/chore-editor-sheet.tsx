import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button, Chip, EmojiPicker, IconButton, Sheet, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { CHORE_EMOJIS, FREQUENCY_LABELS, type Chore, type ChoreFrequency } from '@/domain/chores';
import { addDays, formatDueLabel, todayISO, type ISODate } from '@/domain/dates';
import { makeStyles } from '@/hooks/use-app-theme';
import { useChores } from '@/providers/chores-provider';
import { useSession } from '@/providers/session-provider';

interface ChoreEditorSheetProps {
  visible: boolean;
  /** `null` = tarea nueva. */
  chore: Chore | null;
  onClose: () => void;
}

export function ChoreEditorSheet({ visible, chore, onClose }: ChoreEditorSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={chore ? 'Editar tarea' : 'Nueva tarea'}>
      {visible ? <ChoreForm key={chore?.id ?? 'new'} chore={chore} onClose={onClose} /> : null}
    </Sheet>
  );
}

const FREQUENCIES: ChoreFrequency[] = ['once', 'daily', 'weekly', 'monthly'];

function ChoreForm({ chore, onClose }: { chore: Chore | null; onClose: () => void }) {
  const styles = useStyles();
  const { saveChore, deleteChore } = useChores();
  const { user, members, memberName } = useSession();
  const today = todayISO();

  const [title, setTitle] = useState(chore?.title ?? '');
  const [emoji, setEmoji] = useState(chore?.emoji ?? CHORE_EMOJIS[0]);
  const [frequency, setFrequency] = useState<ChoreFrequency>(chore?.frequency ?? 'once');
  const [assignedTo, setAssignedTo] = useState<string | null>(chore?.assignedTo ?? null);
  const [dueDate, setDueDate] = useState<ISODate | null>(chore ? chore.dueDate : today);

  const quickDates: { label: string; value: ISODate | null }[] = [
    { label: 'Hoy', value: today },
    { label: 'Mañana', value: addDays(today, 1) },
    { label: 'En una semana', value: addDays(today, 7) },
    { label: 'Sin fecha', value: null },
  ];

  const save = () => {
    const clean = title.trim();
    if (!clean) {
      Alert.alert('Falta el nombre', 'Escribe qué hay que hacer.');
      return;
    }
    // Las tareas que se repiten necesitan una fecha de inicio.
    const due = frequency !== 'once' && !dueDate ? today : dueDate;
    saveChore({ title: clean, emoji, frequency, assignedTo, dueDate: due }, chore?.id);
    onClose();
  };

  const confirmDelete = () => {
    if (!chore) return;
    Alert.alert('¿Eliminar tarea?', `"${chore.title}" se borrará para los dos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteChore(chore.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <TextField label="Tarea" value={title} onChangeText={setTitle} placeholder="Ej: Sacar la basura" autoCapitalize="sentences" />

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Ícono
        </AppText>
        <EmojiPicker options={CHORE_EMOJIS} value={emoji} onChange={setEmoji} />
      </View>

      {user ? (
        <View style={styles.group}>
          <AppText variant="label" tone="muted">
            ¿Quién la hace?
          </AppText>
          <View style={styles.chips}>
            <Chip label="Cualquiera" icon="group" selected={assignedTo === null} onPress={() => setAssignedTo(null)} />
            {members.map(member => (
              <Chip
                key={member.userId}
                label={memberName(member.userId)}
                icon="person"
                selected={assignedTo === member.userId}
                onPress={() => setAssignedTo(member.userId)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Se repite
        </AppText>
        <View style={styles.chips}>
          {FREQUENCIES.map(option => (
            <Chip key={option} label={FREQUENCY_LABELS[option]} selected={frequency === option} onPress={() => setFrequency(option)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          {frequency === 'once' ? 'Para cuándo' : 'Próxima vez'}
        </AppText>
        <View style={styles.chips}>
          {quickDates.map(option => (
            <Chip
              key={option.label}
              label={option.label}
              selected={dueDate === option.value}
              onPress={() => setDueDate(option.value)}
            />
          ))}
        </View>
        {dueDate ? (
          <View style={styles.stepper}>
            <IconButton icon="back" accessibilityLabel="Un día antes" onPress={() => setDueDate(addDays(dueDate, -1))} />
            <AppText variant="bodyStrong" style={styles.stepperLabel}>
              {formatDueLabel(dueDate, today)} · {dueDate.split('-').reverse().join('/')}
            </AppText>
            <IconButton icon="chevronRight" accessibilityLabel="Un día después" onPress={() => setDueDate(addDays(dueDate, 1))} />
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label={chore ? 'Guardar cambios' : 'Crear tarea'} icon="check" onPress={save} />
        {chore ? <Button label="Eliminar tarea" icon="delete" variant="danger" onPress={confirmDelete} /> : null}
      </View>
    </>
  );
}

const useStyles = makeStyles(() => ({
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  stepperLabel: { flex: 1, textAlign: 'center' },
  actions: { gap: spacing.sm },
}));
