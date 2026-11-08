import { APP_CONFIG } from '@/constants/config';

/**
 * Punto único para saber si el hogar tiene Premium.
 * Hoy todos lo tienen (`premium.enforced = false`). Al integrar RevenueCat, este hook leerá
 * el estado de la suscripción y el resto de la app no tendrá que cambiar. Ver ROADMAP.md.
 */
export function usePremium() {
  return {
    isPremium: !APP_CONFIG.premium.enforced,
    freeRecipeLimit: APP_CONFIG.premium.freeRecipeLimit,
  };
}
