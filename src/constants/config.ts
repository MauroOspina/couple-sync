/**
 * Configuración general de la app: enlaces públicos y monetización.
 * Cambiar un valor aquí se publica por OTA (no requiere build nuevo).
 */
export const APP_CONFIG = {
  name: 'Nest',
  /** Páginas públicas (GitHub Pages, carpeta `docs/`). */
  links: {
    privacy: 'https://mauroospina.github.io/couple-sync/privacy.html',
    deleteAccount: 'https://mauroospina.github.io/couple-sync/delete-account.html',
    /** Último APK de cada canal: la app avisa si hay uno más nuevo. Ver `docs/app-update.json`. */
    appUpdate: 'https://mauroospina.github.io/couple-sync/app-update.json',
  },
  premium: {
    /**
     * Mientras sea `false`, todos los usuarios tienen las funciones premium.
     * Cuando se integre la suscripción (RevenueCat), cambiarlo a `true`. Ver ROADMAP.md.
     */
    enforced: false,
    /** Recetas que puede guardar un hogar gratuito. */
    freeRecipeLimit: 10,
  },
} as const;
