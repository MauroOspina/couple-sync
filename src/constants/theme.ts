/**
 * Sistema de diseño de Couple Sync.
 * Todos los colores, tamaños y tipografías salen de aquí: no escribas colores sueltos en los componentes.
 * Para estilos que dependen del tema usa `makeStyles` de `@/hooks/use-app-theme`.
 */
import { Platform } from 'react-native';

export interface AppTheme {
  dark: boolean;
  colors: {
    /** Fondo de pantalla */
    background: string;
    /** Tarjetas y hojas */
    surface: string;
    /** Inputs, chips y zonas secundarias */
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    /** Placeholders y textos de muy baja prioridad */
    textSubtle: string;
    primary: string;
    primaryPressed: string;
    primarySoft: string;
    onPrimary: string;
    /** Coral "de pareja": acentos y detalles, no para texto pequeño */
    accent: string;
    accentSoft: string;
    onAccent: string;
    danger: string;
    dangerSoft: string;
    warning: string;
    warningSoft: string;
    success: string;
    successSoft: string;
    overlay: string;
    tabBar: string;
    tabIndicator: string;
  };
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#F7F5F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EEE7',
    border: '#E7E2D9',
    text: '#1F2A24',
    textMuted: '#5E6B64',
    textSubtle: '#8A958F',
    primary: '#23845B',
    primaryPressed: '#1B6A49',
    primarySoft: '#E3F2EA',
    onPrimary: '#FFFFFF',
    accent: '#E8603F',
    accentSoft: '#FFE8E0',
    onAccent: '#FFFFFF',
    danger: '#C93C3C',
    dangerSoft: '#FCE4E2',
    warning: '#A86200',
    warningSoft: '#FFF0D4',
    success: '#23845B',
    successSoft: '#E3F2EA',
    overlay: 'rgba(20, 26, 23, 0.45)',
    tabBar: '#FFFFFF',
    tabIndicator: '#D5EDDF',
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#101412',
    surface: '#1A201C',
    surfaceAlt: '#232B26',
    border: '#2E3832',
    text: '#EDEFEA',
    textMuted: '#B0BAB4',
    textSubtle: '#7F8A83',
    primary: '#4CC38A',
    primaryPressed: '#3AA874',
    primarySoft: '#1C3328',
    onPrimary: '#0B1F15',
    accent: '#FF8A6B',
    accentSoft: '#3A231C',
    onAccent: '#1F0E08',
    danger: '#FF7B72',
    dangerSoft: '#3B1E1C',
    warning: '#F2B24C',
    warningSoft: '#3A2E17',
    success: '#4CC38A',
    successSoft: '#1C3328',
    overlay: 'rgba(0, 0, 0, 0.6)',
    tabBar: '#161B18',
    tabIndicator: '#24402F',
  },
};

/** Familias cargadas en `src/app/_layout.tsx` con `@expo-google-fonts/nunito`. */
export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const textSizes = {
  display: 30,
  title: 24,
  heading: 18,
  body: 16,
  small: 14,
  caption: 12,
} as const;

/** Sombra suave para tarjetas en modo claro (en oscuro se usa borde). */
export function cardShadow(theme: AppTheme) {
  if (theme.dark) return {};
  return Platform.select({
    ios: {
      shadowColor: '#1F2A24',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    default: { elevation: 2 },
  });
}
