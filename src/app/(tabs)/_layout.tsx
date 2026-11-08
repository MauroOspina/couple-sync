import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ChoresProvider, useChores } from '@/providers/chores-provider';
import { InventoryProvider, useInventory } from '@/providers/inventory-provider';
import { RecipesProvider } from '@/providers/recipes-provider';

export default function TabsLayout() {
  return (
    <InventoryProvider>
      <ChoresProvider>
        <RecipesProvider>
          <Tabs />
        </RecipesProvider>
      </ChoresProvider>
    </InventoryProvider>
  );
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
