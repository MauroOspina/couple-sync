import { View } from 'react-native';

import { AppText, Chip, Snackbar } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { makeStyles } from '@/hooks/use-app-theme';
import type { ChoreCompletion } from '@/providers/chores-provider';
import type { HouseholdMember } from '@/services/households';

interface CompletionSnackbarProps {
  completion: ChoreCompletion;
  members: HouseholdMember[];
  memberName: (userId: string | null) => string;
  onUndo: () => void;
  onChangeDoneBy: (userId: string) => void;
}

/** Aviso al completar una tarea: deshacer, o anotarla a nombre de la otra persona (como en Tricount). */
export function CompletionSnackbar({ completion, members, memberName, onUndo, onChangeDoneBy }: CompletionSnackbarProps) {
  const styles = useStyles();
  const { previous, doneBy } = completion;
  return (
    <Snackbar icon="checkCircle" message={`${previous.emoji} ${previous.title}`} actionLabel="Deshacer" onAction={onUndo}>
      {members.length > 1 ? (
        <View style={styles.row}>
          <AppText variant="small" tone="muted">
            La hizo
          </AppText>
          {members.map(member => (
            <Chip
              key={member.userId}
              label={memberName(member.userId)}
              icon="person"
              selected={doneBy === member.userId}
              accessibilityLabel={`La hizo ${memberName(member.userId)}`}
              onPress={() => onChangeDoneBy(member.userId)}
            />
          ))}
        </View>
      ) : null}
    </Snackbar>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
}));
