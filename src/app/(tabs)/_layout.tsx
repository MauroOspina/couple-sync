import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { APP_CONFIG } from '@/constants/config';
import { fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ChoresProvider, useChores } from '@/providers/chores-provider';
import { InventoryProvider, useInventory } from '@/providers/inventory-provider';
import { RecipesProvider, useRecipes } from '@/providers/recipes-provider';

export default function TabsLayout() {
  return (
    <InventoryProvider>
      <ChoresProvider>
        <RecipesProvider>
          <SharedTextReceiver />
          <Tabs />
        </RecipesProvider>
      </ChoresProvider>
    </InventoryProvider>
  );
}

/**
 * "Compartir → Nest" desde otra app (Gemini, el navegador...): guarda el texto y abre Recetas,
 * que lo convierte en receta. Si se comparte sin sesión, espera aquí hasta que haya pestañas.
 */
function SharedTextReceiver() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const { importSharedText, canAddRecipe } = useRecipes();

  useEffect(() => {
    if (!hasShareIntent) return;
    resetShareIntent();
    const text = shareIntent.text?.trim();
    if (!text) return;
    if (!canAddRecipe) {
      Alert.alert('Límite del plan gratuito', `Muy pronto podrás guardar recetas ilimitadas con ${APP_CONFIG.name} Premium.`);
      return;
    }
    if (importSharedText(text) === 0) {
      Alert.alert('No encontramos una receta', 'Comparte la receta completa: el nombre, los ingredientes y los pasos.');
      return;
    }
    router.navigate('/recetas');
  }, [hasShareIntent, shareIntent, resetShareIntent, importSharedText, canAddRecipe, router]);

  return null;
}

/** Pestañas nativas. Íconos: `md` = Material Symbols (Android), `sf` = SF Symbols (iOS). */
function Tabs() {
  const { colors } = useAppTheme();
  const { neededCount } = useInventory();
  const { dueCount } = useChores();

  return (
    <NativeTabs
      backgroundColor={colors.tabBar}
      indicatorColor={colors.tabIndicator}
      rippleColor={colors.primarySoft}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
        selected: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12 },
      }}
      badgeBackgroundColor={colors.accent}
      badgeTextColor={colors.onAccent}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Despensa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="refrigerator" md="kitchen" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mercado">
        <NativeTabs.Trigger.Label>Mercado</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart" md="shopping_cart" />
        <NativeTabs.Trigger.Badge hidden={neededCount === 0}>{String(neededCount)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="recetas">
        <NativeTabs.Trigger.Label>Recetas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tareas">
        <NativeTabs.Trigger.Label>Tareas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checklist" md="task_alt" />
        <NativeTabs.Trigger.Badge hidden={dueCount === 0}>{String(dueCount)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hogar">
        <NativeTabs.Trigger.Label>Hogar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
