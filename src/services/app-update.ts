import { APP_CONFIG } from '@/constants/config';

/** Descarga `docs/app-update.json` de GitHub Pages. Sin conexión o si tarda, devuelve null y no pasa nada. */
export async function fetchAppUpdateManifest(timeoutMs = 5000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${APP_CONFIG.links.appUpdate}?t=${Date.now()}`, { signal: controller.signal });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
