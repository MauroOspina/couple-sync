import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Button, Chip, EmojiPicker, IconButton, Sheet, TextField } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import {
  CHORE_EMOJIS,
  firstRepeatDate,
  MAX_REPEAT_EVERY,
  repeatFieldsOf,
  repeatLabel,
  repeatRuleOf,
  sameRepeatRule,
  unitName,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
  type Chore,
  type RepeatRule,
  type RepeatUnit,
} from '@/domain/chores';
import { addDays, formatDueLabel, parseISODate, todayISO, type ISODate } from '@/domain/dates';
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

const PRESETS: { label: string; rule: RepeatRule | null }[] = [
  { label: 'Una vez', rule: null },
  { label: 'Cada día', rule: { unit: 'day', every: 1, weekdays: [] } },
  { label: 'Cada semana', rule: { unit: 'week', every: 1, weekdays: [] } },
  { label: 'Cada mes', rule: { unit: 'month', every: 1, weekdays: [] } },
];
const UNITS: RepeatUnit[] = ['day', 'week', 'month', 'year'];
/** Iniciales de los días (0 = domingo); miércoles es "X" para no repetir la "M". */
const WEEKDAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function ChoreForm({ chore, onClose }: { chore: Chore | null; onClose: () => void }) {
  const styles = useStyles();
  const { saveChore, deleteChore } = useChores();
  const { user, members, memberName } = useSession();
  const today = todayISO();

  const [title, setTitle] = useState(chore?.title ?? '');
  const [emoji, setEmoji] = useState(chore?.emoji ?? CHORE_EMOJIS[0]);
  const initialRule = chore ? repeatRuleOf(chore) : null;
  const [rule, setRule] = useState<RepeatRule | null>(initialRule);
  const [custom, setCustom] = useState(initialRule !== null && !PRESETS.some(preset => sameRepeatRule(preset.rule, initialRule)));
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
    // Las tareas que se repiten necesitan una fecha de inicio, y debe caer en uno de los días elegidos.
    const start = rule && !dueDate ? today : dueDate;
    const due = start ? firstRepeatDate(start, rule) : null;
    saveChore({ title: clean, emoji, assignedTo, ...repeatFieldsOf(rule), dueDate: due }, chore?.id);
    onClose();
  };

  const choosePreset = (preset: RepeatRule | null) => {
    setCustom(false);
    setRule(preset);
  };

  const chooseCustom = () => {
    setCustom(true);
    // Por defecto: cada semana, el mismo día de la fecha elegida.
    setRule(current => current ?? { unit: 'week', every: 1, weekdays: [parseISODate(dueDate ?? today).getDay()] });
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
          {PRESETS.map(preset => (
            <Chip
              key={preset.label}
              label={preset.label}
              selected={!custom && sameRepeatRule(rule, preset.rule)}
              onPress={() => choosePreset(preset.rule)}
            />
          ))}
          <Chip label="Personalizada" icon="repeat" selected={custom} onPress={chooseCustom} />
        </View>
        {custom && rule ? <CustomRepeat rule={rule} onChange={setRule} /> : null}
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          {rule ? 'Próxima vez' : 'Para cuándo'}
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

/** "Cada [N] [días/semanas/meses/años]" y, si es semanal, en qué días. */
function CustomRepeat({ rule, onChange }: { rule: RepeatRule; onChange: (rule: RepeatRule) => void }) {
  const styles = useStyles();
  const max = MAX_REPEAT_EVERY[rule.unit];

  const toggleWeekday = (day: number) =>
    onChange({
      ...rule,
      weekdays: rule.weekdays.includes(day) ? rule.weekdays.filter(item => item !== day) : [...rule.weekdays, day],
    });

  return (
    <View style={styles.custom}>
      <View style={styles.everyRow}>
        <AppText variant="bodyStrong">Cada</AppText>
        <IconButton
          icon="remove"
          size={36}
          accessibilityLabel="Menos"
          disabled={rule.every <= 1}
          onPress={() => onChange({ ...rule, every: rule.every - 1 })}
        />
        <AppText variant="heading" style={styles.everyValue} accessibilityLabel={`Cada ${rule.every}`}>
          {rule.every}
        </AppText>
        <IconButton
          icon="add"
          size={36}
          accessibilityLabel="Más"
          disabled={rule.every >= max}
          onPress={() => onChange({ ...rule, every: rule.every + 1 })}
        />
      </View>

      <View style={styles.chips}>
        {UNITS.map(unit => (
          <Chip
            key={unit}
            label={unitName(unit, rule.every)}
            selected={rule.unit === unit}
            onPress={() =>
              onChange({ unit, every: Math.min(rule.every, MAX_REPEAT_EVERY[unit]), weekdays: unit === 'week' ? rule.weekdays : [] })
            }
          />
        ))}
      </View>

      {rule.unit === 'week' ? (
        <View style={styles.chips}>
          {WEEKDAY_ORDER.map(day => (
            <Chip
              key={day}
              label={WEEKDAY_LETTERS[day]}
              accessibilityLabel={WEEKDAY_SHORT[day]}
              selected={rule.weekdays.includes(day)}
              onPress={() => toggleWeekday(day)}
              style={styles.dayChip}
            />
          ))}
        </View>
      ) : null}

      <AppText variant="small" tone="muted">
        {repeatLabel(rule)}
        {rule.unit === 'week' && rule.weekdays.length === 0 ? ' (el mismo día de la fecha)' : ''}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  stepperLabel: { flex: 1, textAlign: 'center' },
  actions: { gap: spacing.sm },
  custom: {
    gap: spacing.md,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  everyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  everyValue: { minWidth: 32, textAlign: 'center' },
  dayChip: { minWidth: 40, justifyContent: 'center' },
}));
