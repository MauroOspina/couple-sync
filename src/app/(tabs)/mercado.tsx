import { useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, RefreshControl, SectionList, Share, View } from 'react-native';

import { AddItemBar } from '@/components/inventory/add-item-bar';
import { FinishShoppingSheet } from '@/components/inventory/finish-shopping-sheet';
import { ProductEditSheet } from '@/components/inventory/product-edit-sheet';
import { ProductRow } from '@/components/inventory/product-row';
import { PurchaseHistorySheet } from '@/components/inventory/purchase-history-sheet';
import { AppText, Button, EmptyState, IconButton, LoadingView, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { DEFAULT_CATEGORY } from '@/constants/catalog';
import { spacing } from '@/constants/theme';
import { formatShoppingList, groupByCategory, isInCart, splitMarket, type Product } from '@/domain/inventory';
import { formatMoney } from '@/domain/purchases';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useInventory } from '@/providers/inventory-provider';
import { usePurchases } from '@/providers/purchases-provider';

/**
 * Lista del mercado, agrupada por categoría. "Falta" entra sola; "Queda poco" y lo que se quitó
 * a mano quedan abajo en "Fuera de la lista", por si acaso.
 */
export default function MarketScreen() {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const { products, ready, toggleCart, setOnList, finishShopping, addProduct, refresh } = useInventory();
  const { addPurchase, deletePurchase } = usePurchases();
  const { refreshing, onRefresh } = useRefresh(refresh);
  const [editing, setEditing] = useState<Product | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showOffList, setShowOffList] = useState(false);

  const { listed, offList } = useMemo(() => splitMarket(products), [products]);
  const sections = useMemo(
    () => groupByCategory(listed).map(group => ({ key: group.category, title: `${group.emoji} ${group.category}`, data: group.items })),
    [listed],
  );

  if (!ready) return <LoadingView />;

  const inCart = listed.filter(isInCart).length;

  const finish = (total: number | null) => {
    setFinishing(false);
    const { items, undo } = finishShopping();
    const purchase = addPurchase(items, total);
    const spent = total === null ? '' : ` Gastaron ${formatMoney(total)}.`;
    Alert.alert('¡Mercado listo! 🛒', `La despensa quedó al día con ${items.length} ${items.length === 1 ? 'producto' : 'productos'}.${spent}`, [
      {
        text: 'Deshacer',
        style: 'cancel',
        onPress: () => {
          undo();
          deletePurchase(purchase.id);
        },
      },
      { text: 'Listo' },
    ]);
  };

  const shareList = () => {
    void Share.share({ message: formatShoppingList(products) });
  };

  // Si el producto nuevo no encaja en ninguna categoría, se abre el editor para elegirla.
  const add = (name: string) => {
    const product = addProduct(name, undefined, 'out');
    if (product?.category === DEFAULT_CATEGORY) {
      Keyboard.dismiss();
      setEditing(product);
    }
  };

  const offListSection =
    offList.length > 0 ? (
      <View style={styles.offList}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showOffList }}
          accessibilityLabel={`Fuera de la lista, ${offList.length} productos`}
          onPress={() => setShowOffList(open => !open)}>
          <SectionTitle
            title={`Fuera de la lista (${offList.length})`}
            right={
              <AppText variant="smallStrong" tone="primary">
                {showOffList ? 'Ocultar' : 'Ver'}
              </AppText>
            }
          />
        </Pressable>
        {showOffList ? (
          <>
            <AppText variant="caption" tone="subtle">
              Queda poco o lo quitaron de la lista. Toca uno para agregarlo.
            </AppText>
            {offList.map(item => (
              <ProductRow key={item.id} product={item} mode="offList" showCategory onPress={() => setOnList(item.id, true)} onEdit={() => setEditing(item)} />
            ))}
          </>
        ) : null}
      </View>
    ) : null;

  return (
    <Screen>
      <ScreenHeader
        title="Mercado"
        subtitle={listed.length ? `${listed.length} por comprar · ${inCart} en el carrito` : 'Nada en la lista'}
        right={
          <View style={styles.headerActions}>
            <IconButton icon="history" accessibilityLabel="Historial de compras" onPress={() => setHistoryOpen(true)} />
            {listed.length > 0 ? <IconButton icon="share" accessibilityLabel="Compartir la lista del mercado" onPress={shareList} /> : null}
          </View>
        }>
        {listed.length > 0 ? <ProgressBar value={inCart / listed.length} /> : null}
      </ScreenHeader>

      <SectionList
        sections={sections}
        keyExtractor={product => product.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ItemSeparatorComponent={Separator}
        renderSectionHeader={({ section }) => (
          <SectionTitle
            title={section.title}
            right={
              <AppText variant="caption" tone="subtle">
                {section.data.length}
              </AppText>
            }
          />
        )}
        renderItem={({ item }) => (
          <ProductRow product={item} mode="market" onPress={() => toggleCart(item.id)} onEdit={() => setEditing(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🎉"
            title="¡No falta nada!"
            message="Cuando algo se acabe, márcalo en la Despensa o escríbelo aquí abajo."
          />
        }
        ListFooterComponent={offListSection}
      />

      {inCart > 0 ? (
        <View style={styles.finishBar}>
          <Button label={`Terminar mercado · ${inCart}`} icon="check" onPress={() => setFinishing(true)} />
        </View>
      ) : null}
      <AddItemBar placeholder="Agregar algo que falta..." onSubmit={add} />

      <ProductEditSheet product={editing} onClose={() => setEditing(null)} />
      <FinishShoppingSheet visible={finishing} count={inCart} onClose={() => setFinishing(false)} onConfirm={finish} />
      <PurchaseHistorySheet visible={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(theme => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  offList: { gap: spacing.sm, marginTop: spacing.lg },
  finishBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: theme.colors.surface },
}));
