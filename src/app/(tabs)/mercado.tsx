import { useMemo, useState } from 'react';
import { Alert, SectionList, View } from 'react-native';

import { AddItemBar } from '@/components/inventory/add-item-bar';
import { ProductEditSheet } from '@/components/inventory/product-edit-sheet';
import { ProductRow } from '@/components/inventory/product-row';
import { AppText, Button, EmptyState, LoadingView, ProgressBar, Screen, ScreenHeader, SectionTitle } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { groupByCategory, isNeeded, type Product } from '@/domain/inventory';
import { makeStyles } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';

/** Lista del mercado: lo que está en "Queda poco" o "Falta", agrupado por categoría. */
export default function MarketScreen() {
  const styles = useStyles();
  const { products, ready, toggleCart, finishShopping, addProduct } = useInventory();
  const [editing, setEditing] = useState<Product | null>(null);

  const needed = useMemo(() => products.filter(isNeeded), [products]);
  const sections = useMemo(
    () => groupByCategory(needed).map(group => ({ key: group.category, title: `${group.emoji} ${group.category}`, data: group.items })),
    [needed],
  );

  if (!ready) return <LoadingView />;

  const inCart = needed.filter(product => product.inCart).length;

  const finish = () => {
    Alert.alert('¿Terminar el mercado?', `${inCart} ${inCart === 1 ? 'producto pasará' : 'productos pasarán'} a "Hay" en la despensa.`, [
      { text: 'Seguir comprando', style: 'cancel' },
      {
        text: 'Terminar',
        onPress: () => {
          const bought = finishShopping();
          Alert.alert('¡Mercado listo! 🛒', `La despensa quedó al día con ${bought} ${bought === 1 ? 'producto' : 'productos'}.`);
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Mercado"
        subtitle={needed.length ? `${needed.length} por comprar · ${inCart} en el carrito` : 'No falta nada'}>
        {needed.length > 0 ? <ProgressBar value={inCart / needed.length} /> : null}
      </ScreenHeader>

      <SectionList
        sections={sections}
        keyExtractor={product => product.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
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
      />

      {inCart > 0 ? (
        <View style={styles.finishBar}>
          <Button label={`Terminar mercado · ${inCart}`} icon="check" onPress={finish} />
        </View>
      ) : null}
      <AddItemBar placeholder="Agregar algo que falta..." onSubmit={name => addProduct(name, undefined, 'out')} />

      <ProductEditSheet product={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(theme => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  finishBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: theme.colors.surface },
}));
