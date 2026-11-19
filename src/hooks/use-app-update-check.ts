import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';

import { APP_CONFIG } from '@/constants/config';
import { findAppUpdate } from '@/domain/app-update';
import { fetchAppUpdateManifest } from '@/services/app-update';

/**
 * Al abrir la app, si hay un APK más nuevo para su canal (ver `docs/app-update.json`), ofrece descargarlo.
 * Android pregunta "¿Actualizar?" y se instala encima, sin desinstalar. En desarrollo no hace nada.
 */
export function useAppUpdateCheck(enabled: boolean) {
  useEffect(() => {
    if (!enabled || __DEV__ || !Updates.isEnabled) return;
    let cancelled = false;

    void fetchAppUpdateManifest().then(manifest => {
      const update = findAppUpdate(manifest, Updates.channel, Updates.runtimeVersion);
      if (cancelled || !update) return;
      Alert.alert(
        `Hay una versión nueva de ${APP_CONFIG.name}`,
        `${update.notes ? `${update.notes}\n\n` : ''}Toca "Actualizar", descarga el archivo y ábrelo. Se instala encima: no pierdes nada.`,
        [
          { text: 'Después', style: 'cancel' },
          { text: 'Actualizar', onPress: () => void Linking.openURL(update.url) },
        ],
      );
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
