import { StyleSheet, useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from '@/constants/theme';

/** Tema activo según el modo claro/oscuro del teléfono. */
export function useAppTheme(): AppTheme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

/**
 * Crea un hook de estilos que depende del tema. Los dos StyleSheets se crean una sola vez.
 *
 * const useStyles = makeStyles(theme => ({ card: { backgroundColor: theme.colors.surface } }));
 * function Card() { const styles = useStyles(); ... }
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: AppTheme) => T) {
  const light = StyleSheet.create(factory(lightTheme));
  const dark = StyleSheet.create(factory(darkTheme));
  return function useStyles(): T {
    return useAppTheme().dark ? dark : light;
  };
}
