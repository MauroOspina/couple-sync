import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { statusColors } from '@/components/inventory/status-pill';
import { AppText, Button, Chip, Sheet, TextField } from '@/components/ui';
import { CATEGORIES, STATUS_LABELS } from '@/constants/catalog';
import { radius, spacing } from '@/constants/theme';
import type { Product, StockStatus } from '@/domain/inventory';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';

interface ProductEditSheetProps {
  product: Product | null;
  onClose: () => void;
}

/** Editar nombre, categoría y estado de un producto, o eliminarlo. */
export function ProductEditSheet({ product, onClose }: ProductEditSheetProps) {
  return (
    <Sheet visible={product !== null} onClose={onClose} title="Editar producto">
      {product ? <ProductForm key={product.id} product={product} onClose={onClose} /> : null}
    </Sheet>
  );
}

function ProductForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { updateProduct, deleteProduct } = useInventory();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [status, setStatus] = useState<StockStatus>(product.status);

  const save = () => {
    const clean = name.trim();
    if (!clean) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para el producto.');
      return;
    }
    updateProduct({ ...product, name: clean, category, status, inCart: status === 'ok' ? false : product.inCart });
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert('¿Eliminar producto?', `"${product.name}" se borrará de la despensa de los dos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteProduct(product.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Leche deslactosada" autoCapitalize="sentences" />

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Estado
        </AppText>
        <View style={styles.statusRow}>
          {(['ok', 'low', 'out'] as const).map(option => {
            const selected = option === status;
            const { fg, bg } = statusColors(theme, option);
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setStatus(option)}
                style={[styles.statusOption, selected && { backgroundColor: bg, borderColor: fg }]}>
                <AppText variant="smallStrong" style={{ color: selected ? fg : theme.colors.textMuted }}>
                  {STATUS_LABELS[option]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Categoría
        </AppText>
        <View style={styles.chips}>
          {Object.entries(CATEGORIES).map(([option, emoji]) => (
            <Chip key={option} label={option} emoji={emoji} selected={option === category} onPress={() => setCategory(option)} />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Guardar cambios" icon="check" onPress={save} />
        <Button label="Eliminar producto" icon="delete" variant="danger" onPress={confirmDelete} />
      </View>
    </>
  );
}

const useStyles = makeStyles(theme => ({
  group: { gap: spacing.sm },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { gap: spacing.sm },
}));
