import { Pressable, View } from 'react-native';

import { StatusPill, statusColors } from '@/components/inventory/status-pill';
import { AppText, Icon, IconButton } from '@/components/ui';
import { STATUS_LABELS } from '@/constants/catalog';
import { cardShadow, radius, spacing } from '@/constants/theme';
import { categoryEmoji, type Product } from '@/domain/inventory';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface ProductRowProps {
  product: Product;
  /** pantry: tocar cambia el estado · market: tocar lo mete/saca del carrito */
  mode: 'pantry' | 'market';
  onPress: () => void;
  onEdit: () => void;
  showCategory?: boolean;
}

export function ProductRow({ product, mode, onPress, onEdit, showCategory = false }: ProductRowProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const inCart = mode === 'market' && Boolean(product.inCart);
  const accent = statusColors(theme, product.status).fg;

  const label =
    mode === 'market'
      ? `${product.name}, ${inCart ? 'en el carrito' : 'por comprar'}`
      : `${product.name}, ${STATUS_LABELS[product.status]}`;
  const hint = mode === 'market' ? 'Toca para marcarlo en el carrito' : 'Toca para cambiar el estado';

  return (
    <View style={[styles.row, mode === 'pantry' && { borderLeftColor: accent }, inCart && styles.rowInCart]}>
      <Pressable
        accessibilityRole={mode === 'market' ? 'checkbox' : 'button'}
        accessibilityState={mode === 'market' ? { checked: inCart } : undefined}
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        onLongPress={onEdit}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        {mode === 'market' ? (
          <Icon name={inCart ? 'checkCircle' : 'circle'} size={26} color={inCart ? theme.colors.primary : theme.colors.textSubtle} />
        ) : null}
        <AppText style={styles.emoji}>{categoryEmoji(product.category)}</AppText>
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={2} style={inCart && styles.nameInCart}>
            {product.name}
          </AppText>
          {showCategory ? (
            <AppText variant="caption" tone="subtle" numberOfLines={1}>
              {product.category}
            </AppText>
          ) : null}
        </View>
        {inCart ? null : <StatusPill status={product.status} />}
      </Pressable>
      <IconButton icon="edit" variant="plain" size={36} accessibilityLabel={`Editar ${product.name}`} onPress={onEdit} />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    paddingRight: spacing.xs,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.border,
    ...cardShadow(theme),
  },
  rowInCart: { backgroundColor: theme.colors.primarySoft },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    minHeight: 60,
  },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 24, lineHeight: 30 },
  texts: { flex: 1, gap: 2 },
  nameInCart: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
}));
