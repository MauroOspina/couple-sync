/**
 * Configuración general de la app: enlaces públicos y monetización.
 * Cambiar un valor aquí se publica por OTA (no requiere build nuevo).
 */
export const APP_CONFIG = {
  name: 'Couple Sync',
  /** Páginas públicas (GitHub Pages, carpeta `docs/`). */
  links: {
    privacy: 'https://mauroospina.github.io/couple-sync/privacy.html',
    deleteAccount: 'https://mauroospina.github.io/couple-sync/delete-account.html',
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
