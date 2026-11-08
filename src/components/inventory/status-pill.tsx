import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { STATUS_LABELS } from '@/constants/catalog';
import { radius, spacing, type AppTheme } from '@/constants/theme';
import type { StockStatus } from '@/domain/inventory';
import { useAppTheme } from '@/hooks/use-app-theme';

export function statusColors(theme: AppTheme, status: StockStatus) {
  const { colors } = theme;
  if (status === 'ok') return { fg: colors.success, bg: colors.successSoft };
  if (status === 'low') return { fg: colors.warning, bg: colors.warningSoft };
  return { fg: colors.danger, bg: colors.dangerSoft };
}

export function StatusPill({ status }: { status: StockStatus }) {
  const theme = useAppTheme();
  const { fg, bg } = statusColors(theme, status);
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
      <AppText variant="caption" style={{ color: fg }}>
        {STATUS_LABELS[status]}
      </AppText>
    </View>
  );
}
