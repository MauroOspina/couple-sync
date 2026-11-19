import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, RefreshControl, SectionList, Share, View } from 'react-native';

import { AddItemBar } from '@/components/inventory/add-item-bar';
import { ProductEditSheet } from '@/components/inventory/product-edit-sheet';
import { ProductRow } from '@/components/inventory/product-row';
import { AppText, Button, EmptyState, IconButton, LoadingView, ProgressBar, Screen, ScreenHeader, SectionTitle, Snackbar } from '@/components/ui';
import { DEFAULT_CATEGORY } from '@/constants/catalog';
import { spacing } from '@/constants/theme';
import { formatShoppingList, groupByCategory, isInCart, splitMarket, type Product } from '@/domain/inventory';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { useRefresh } from '@/hooks/use-refresh';
import { useInventory } from '@/providers/inventory-provider';

const SNACKBAR_MS = 4000;

/**
 * Lista del mercado, agrupada por categoría. "Falta" entra sola; "Queda poco" y lo que se quitó
 * a mano quedan abajo en "Fuera de la lista", por si acaso.
 */
export default function MarketScreen() {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const { products, ready, toggleCart, setOnList, updateProduct, finishShopping, addProduct, refresh } = useInventory();
  const { refreshing, onRefresh } = useRefresh(refresh);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showOffList, setShowOffList] = useState(false);
  /** Lo último que se sacó de la lista, para poder deshacerlo. */
  const [removed, setRemoved] = useState<Product | null>(null);

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), SNACKBAR_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  const { listed, offList } = useMemo(() => splitMarket(products), [products]);
  const sections = useMemo(
    () => groupByCategory(listed).map(group => ({ key: group.category, title: `${group.emoji} ${group.category}`, data: group.items })),
    [listed],
  );

  if (!ready) return <LoadingView />;

  const inCart = listed.filter(isInCart).length;

  const finish = () => {
    Alert.alert('¿Terminar el mercado?', `${inCart} ${inCart === 1 ? 'producto pasará' : 'productos pasarán'} a "Hay" en la despensa.`, [
      { text: 'Seguir comprando', style: 'cancel' },
      {
        text: 'Terminar',
        onPress: () => {
          const { items, undo } = finishShopping();
          Alert.alert('¡Mercado listo! 🛒', `La despensa quedó al día con ${items.length} ${items.length === 1 ? 'producto' : 'productos'}.`, [
            { text: 'Deshacer', style: 'cancel', onPress: undo },
            { text: 'Listo' },
          ]);
        },
      },
    ]);
  };

  const removeFromList = (product: Product) => {
    setOnList(product.id, false);
    setRemoved(product);
  };

  const undoRemove = () => {
    if (removed) updateProduct(removed);
    setRemoved(null);
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
          listed.length > 0 ? <IconButton icon="share" accessibilityLabel="Compartir la lista del mercado" onPress={shareList} /> : null
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
          <ProductRow
            product={item}
            mode="market"
            onPress={() => toggleCart(item.id)}
            onRemove={() => removeFromList(item)}
            onEdit={() => setEditing(item)}
          />
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
          <Button label={`Terminar mercado · ${inCart}`} icon="check" onPress={finish} />
        </View>
      ) : null}
      <AddItemBar placeholder="Agregar algo que falta..." onSubmit={add} />

      {removed ? (
        <Snackbar icon="cartRemove" message={`${removed.name}: no se compra esta vez`} actionLabel="Deshacer" onAction={undoRemove} />
      ) : null}

      <ProductEditSheet product={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(theme => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  offList: { gap: spacing.sm, marginTop: spacing.lg },
  finishBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: theme.colors.surface },
}));
