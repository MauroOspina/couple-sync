// Se importa cada peso por separado para no empaquetar las 18 variantes de la fuente.
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, type PropsWithChildren } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';
import { SessionProvider, useSession } from '@/providers/session-provider';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  return (
    <SessionProvider>
      <NavigationTheme>
        <RootNavigator fontsReady={fontsLoaded || fontError !== null} />
      </NavigationTheme>
    </SessionProvider>
  );
}

/**
 * Elige la pantalla según la sesión. Las rutas protegidas evitan que se pueda llegar a las
 * pestañas sin hogar, o al login con sesión iniciada.
 */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useSession();
  const ready = fontsReady && status !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!fontsReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsHousehold'}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut' || status === 'loading'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

function NavigationTheme({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const navigationTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}
