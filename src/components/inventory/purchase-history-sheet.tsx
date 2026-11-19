import { Alert, View } from 'react-native';

import { AppText, Card, EmptyState, Sheet } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { formatMoney, formatPurchaseDate, groupPurchasesByMonth, summarizeItems, type Purchase } from '@/domain/purchases';
import { makeStyles } from '@/hooks/use-app-theme';
import { usePurchases } from '@/providers/purchases-provider';

interface PurchaseHistorySheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Mercados terminados, agrupados por mes, con lo que gastaron. */
export function PurchaseHistorySheet({ visible, onClose }: PurchaseHistorySheetProps) {
  const styles = useStyles();
  const { purchases, deletePurchase } = usePurchases();
  const months = groupPurchasesByMonth(purchases);

  const confirmDelete = (purchase: Purchase) => {
    Alert.alert('¿Borrar este mercado del historial?', 'La despensa no cambia.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => deletePurchase(purchase.id) },
    ]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Historial de compras">
      {months.length === 0 ? (
        <EmptyState emoji="🧾" title="Aún no hay compras" message="Cada vez que terminen un mercado, queda guardado aquí." />
      ) : (
        months.map(month => (
          <View key={month.key} style={styles.month}>
            <View style={styles.monthHeader}>
              <AppText variant="heading">{month.label}</AppText>
              {month.total > 0 ? (
                <AppText variant="bodyStrong" tone="primary">
                  {formatMoney(month.total)}
                </AppText>
              ) : null}
            </View>
            {month.purchases.map(purchase => (
              <Card
                key={purchase.id}
                onLongPress={() => confirmDelete(purchase)}
                accessibilityLabel={`Mercado del ${formatPurchaseDate(purchase.boughtAt)}`}
                accessibilityHint="Mantén presionado para borrarlo del historial">
                <View style={styles.purchaseHeader}>
                  <AppText variant="bodyStrong">{formatPurchaseDate(purchase.boughtAt)}</AppText>
                  <AppText variant="bodyStrong" tone={purchase.total === null ? 'subtle' : 'default'}>
                    {purchase.total === null ? 'Sin total' : formatMoney(purchase.total)}
                  </AppText>
                </View>
                <AppText variant="small" tone="muted" numberOfLines={2}>
                  {purchase.items.length} {purchase.items.length === 1 ? 'producto' : 'productos'} · {summarizeItems(purchase.items)}
                </AppText>
              </Card>
            ))}
          </View>
        ))
      )}
    </Sheet>
  );
}

const useStyles = makeStyles(() => ({
  month: { gap: spacing.sm },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  purchaseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
}));
