import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, FlatList, ScrollView, View } from 'react-native';

import { AddItemBar } from '@/components/inventory/add-item-bar';
import { CategoryGrid } from '@/components/inventory/category-grid';
import { ProductEditSheet } from '@/components/inventory/product-edit-sheet';
import { ProductRow } from '@/components/inventory/product-row';
import { AppText, Banner, Button, Card, EmptyState, Icon, LoadingView, Screen, ScreenHeader, TextField } from '@/components/ui';
import { DEFAULT_CATEGORY } from '@/constants/catalog';
import { radius, spacing } from '@/constants/theme';
import { categoryEmoji, searchProducts, sortByName, summarizeCategories, type Product } from '@/domain/inventory';
import { capitalize, matchKey } from '@/domain/text';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';
import { useSession } from '@/providers/session-provider';

/** Despensa: categorías, búsqueda y estado de cada producto (Hay / Queda poco / Falta). */
export default function PantryScreen() {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { household, isGuest } = useSession();
  const { products, ready, pendingCount, neededCount, cycleStatus, addProduct } = useInventory();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  // El botón "atrás" de Android cierra la categoría en vez de salir de la app.
  useEffect(() => {
    if (!category) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setCategory(null);
      return true;
    });
    return () => subscription.remove();
  }, [category]);

  const searching = query.trim().length > 0;
  const categories = useMemo(() => summarizeCategories(products), [products]);
  const list = useMemo(() => {
    if (searching) return sortByName(searchProducts(products, query));
    if (category) return sortByName(products.filter(product => (product.category || DEFAULT_CATEGORY) === category));
    return [];
  }, [products, query, searching, category]);

  if (!ready) return <LoadingView message="Cargando la despensa..." />;

  const inCategory = category !== null && !searching;
  const hasExactMatch = list.some(product => matchKey(product.name) === matchKey(query));
  const addFromSearch = () => {
    addProduct(query, undefined, 'ok');
    setQuery('');
  };

  return (
    <Screen>
      <ScreenHeader
        title={inCategory ? `${categoryEmoji(category)} ${category}` : 'Despensa'}
        subtitle={
          inCategory
            ? 'Toca un producto para cambiar su estado'
            : household
              ? `🏠 ${household.name}`
              : isGuest
                ? 'Modo local · solo en este teléfono'
                : undefined
        }
        onBack={inCategory ? () => setCategory(null) : undefined}>
        <TextField
          icon="search"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Buscar o agregar un producto"
          returnKeyType="search"
          autoCorrect={false}
        />
      </ScreenHeader>

      {pendingCount > 0 ? (
        <Banner
          icon="cloudOff"
          message={`${pendingCount} ${pendingCount === 1 ? 'cambio se enviará' : 'cambios se enviarán'} cuando haya conexión`}
        />
      ) : null}

      {searching || inCategory ? (
        <FlatList
          data={list}
          keyExtractor={product => product.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              mode="pantry"
              showCategory={searching}
              onPress={() => cycleStatus(item.id)}
              onEdit={() => setEditing(item)}
            />
          )}
          ListEmptyComponent={
            searching ? null : (
              <EmptyState emoji="📭" title="Categoría vacía" message="Agrega el primer producto con la barra de abajo." />
            )
          }
          ListFooterComponent={
            searching && !hasExactMatch ? (
              <Button
                label={`Agregar "${capitalize(query.trim())}"`}
                icon="add"
                variant="secondary"
                style={styles.footerButton}
                onPress={addFromSearch}
              />
            ) : null
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {neededCount > 0 ? (
            <Card style={styles.summary} onPress={() => router.navigate('/mercado')} accessibilityLabel={`${neededCount} productos por comprar. Ir al mercado`}>
              <View style={styles.summaryIcon}>
                <Icon name="cart" size={22} color={colors.accent} />
              </View>
              <View style={styles.summaryText}>
                <AppText variant="bodyStrong">
                  {neededCount} {neededCount === 1 ? 'producto' : 'productos'} por comprar
                </AppText>
                <AppText variant="caption" tone="muted">
                  Toca para ver la lista del mercado
                </AppText>
              </View>
              <Icon name="chevronRight" size={22} color={colors.textSubtle} />
            </Card>
          ) : null}
          {categories.length > 0 ? (
            <CategoryGrid categories={categories} onSelect={setCategory} />
          ) : (
            <EmptyState
              emoji="🥫"
              title="La despensa está vacía"
              message="Escribe un producto en el buscador de arriba para agregarlo."
            />
          )}
        </ScrollView>
      )}

      {inCategory ? <AddItemBar placeholder={`Agregar a ${category}...`} onSubmit={name => addProduct(name, category)} /> : null}

      <ProductEditSheet product={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const useStyles = makeStyles(theme => ({
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  content: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.md },
  footerButton: { marginTop: spacing.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
}));
