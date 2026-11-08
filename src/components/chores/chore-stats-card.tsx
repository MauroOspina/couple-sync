import { View } from 'react-native';

import { AppText, Avatar, Card, ProgressBar } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { countByMember, type ChoreLog } from '@/domain/chores';
import { startOfMonthISO } from '@/domain/dates';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import type { HouseholdMember } from '@/services/households';

interface ChoreStatsCardProps {
  logs: ChoreLog[];
  members: HouseholdMember[];
  memberName: (userId: string | null) => string;
}

/** Quién hizo más tareas este mes. Candidata a función Premium (ver ROADMAP.md). */
export function ChoreStatsCard({ logs, members, memberName }: ChoreStatsCardProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const counts = countByMember(logs, startOfMonthISO());
  const rows = members
    .map(member => ({ userId: member.userId, name: memberName(member.userId), count: counts[member.userId] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length < 2 || total === 0) return null;
  const max = Math.max(...rows.map(row => row.count), 1);

  return (
    <Card style={styles.card}>
      <AppText variant="label" tone="muted">
        Este mes · {total} {total === 1 ? 'tarea hecha' : 'tareas hechas'}
      </AppText>
      {rows.map((row, index) => (
        <View key={row.userId} style={styles.row}>
          <Avatar name={row.name} size={32} />
          <View style={styles.texts}>
            <View style={styles.labelRow}>
              <AppText variant="smallStrong">{row.name}</AppText>
              <AppText variant="smallStrong" tone="muted">
                {row.count}
              </AppText>
            </View>
            <ProgressBar value={row.count / max} color={index === 0 ? colors.primary : colors.accent} />
          </View>
        </View>
      ))}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
}));
