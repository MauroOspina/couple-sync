import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type SymbolNames = Exclude<SymbolViewProps['name'], string>;

/**
 * Íconos de la app: Material Symbols en Android, SF Symbols en iOS.
 * Para agregar uno: busca el nombre en fonts.google.com/icons (Android) y en la app SF Symbols (iOS).
 * TypeScript avisa si el nombre no existe.
 */
const ICONS = {
  add: { ios: 'plus', android: 'add' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  cart: { ios: 'cart', android: 'shopping_cart' },
  cartAdd: { ios: 'cart.badge.plus', android: 'add_shopping_cart' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  circle: { ios: 'circle', android: 'radio_button_unchecked' },
  close: { ios: 'xmark', android: 'close' },
  cloudOff: { ios: 'icloud.slash', android: 'cloud_off' },
  delete: { ios: 'trash', android: 'delete' },
  edit: { ios: 'pencil', android: 'edit' },
  group: { ios: 'person.2', android: 'group' },
  heart: { ios: 'heart', android: 'favorite' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  home: { ios: 'house', android: 'home' },
  info: { ios: 'info.circle', android: 'info' },
  lightbulb: { ios: 'lightbulb', android: 'lightbulb' },
  lock: { ios: 'lock', android: 'lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  pantry: { ios: 'refrigerator', android: 'kitchen' },
  person: { ios: 'person', android: 'person' },
  privacy: { ios: 'hand.raised', android: 'privacy_tip' },
  recipes: { ios: 'book', android: 'menu_book' },
  remove: { ios: 'minus', android: 'remove' },
  repeat: { ios: 'repeat', android: 'repeat' },
  search: { ios: 'magnifyingglass', android: 'search' },
  send: { ios: 'paperplane', android: 'send' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  sync: { ios: 'arrow.triangle.2.circlepath', android: 'sync' },
  tasks: { ios: 'checklist', android: 'task_alt' },
  timer: { ios: 'timer', android: 'timer' },
  userRemove: { ios: 'person.crop.circle.badge.xmark', android: 'person_remove' },
} satisfies Record<string, SymbolNames>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 22, color, style }: IconProps) {
  const theme = useAppTheme();
  const { ios, android } = ICONS[name];
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color ?? theme.colors.text}
      style={[{ width: size, height: size }, style]}
    />
  );
}
