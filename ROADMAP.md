# Roadmap · Couple Sync hacia Google Play

Cada tarea de Cline va en una **conversación nueva** (botón +). Al terminar, revisa el diff y haz commit tú.

## Fase 1 · Poner en marcha la v2 (tú, ~30 min)
1. **Supabase**: SQL Editor → pega todo `supabase/schema.sql` → Run. Crea las tablas de tareas y recetas y la función para eliminar la cuenta. Se puede ejecutar varias veces.
2. **Probar**: `npx expo start` con Expo Go SDK 57. Revisa las 5 pestañas, crear/editar/borrar en cada una y la sincronización entre los dos teléfonos.
3. **Probar eliminar cuenta** con una cuenta de Google de prueba (no la tuya): Hogar → Eliminar mi cuenta.
4. **Publicar**: `git push origin v2:preview` (prueba en el APK de preview) y luego merge a `main` + push.

## Fase 2 · Requisitos de Google Play (tú)
- [ ] **Correo de contacto**: reemplaza `CORREO_DE_CONTACTO` en `docs/privacy.html` y `docs/delete-account.html` por un correo personal.
- [ ] **GitHub Pages**: repo → Settings → Pages → Branch `main`, carpeta `/docs`. Las URLs quedan como en `src/constants/config.ts`.
- [ ] **Google OAuth**: Google Cloud Console → pantalla de consentimiento → "Publicar app" (en modo prueba solo entran 100 usuarios).
- [ ] **Ícono y splash propios** (Canva, 1024×1024): reemplaza `assets/images/icon.png`, `android-icon-*.png` y `splash-icon.png`. Cambia los colores de fondo en `app.json` a `#F7F5F0`. Requiere build nuevo.
- [ ] **Play Console** ($25, cuenta personal) → crear app → ficha de tienda (capturas, descripción, *feature graphic* 1024×500) → formulario *Data safety* (correo y nombre; datos cifrados en tránsito; se pueden borrar).
- [ ] **Build de producción**: `npx eas-cli@latest build --profile production --platform android` → sube el `.aab` a *Prueba cerrada*.
- [ ] **Prueba cerrada**: 12 testers durante 14 días seguidos. Luego, solicitar producción.

## Fase 3 · Mejoras con Cline (prompts listos)
**Pull to refresh**
> En las pantallas `src/app/(tabs)/index.tsx`, `mercado.tsx`, `recetas.tsx` y `tareas.tsx`, agrega pull-to-refresh a la lista principal usando `RefreshControl` de react-native con el color `colors.primary` de `useAppTheme()`. Al refrescar llama a `refresh()` de `useInventory()` (despensa y mercado). En recetas y tareas no hace falta.

**Deshacer al terminar el mercado**
> En `src/app/(tabs)/mercado.tsx`, después de `finishShopping()` guarda los productos que cambiaron y muestra un `Alert` con botón "Deshacer" que los restaure con `updateProduct` de `useInventory()`.

**Buscar recetas**
> En `src/app/(tabs)/recetas.tsx` agrega un `TextField` con `icon="search"` en el `ScreenHeader` que filtre por título usando `normalizeText` de `src/domain/text.ts`.

**Categoría al agregar desde el mercado**
> En `src/app/(tabs)/mercado.tsx`, después de agregar un producto con la barra de abajo, si su categoría quedó en "Otros" abre `ProductEditSheet` con ese producto para que la persona elija la categoría.

## Fase 4 · Monetización (cuando haya usuarios)
1. **Premium con RevenueCat** (gratis hasta cierto nivel de ingresos). Requiere build nuevo.
   - `npx expo install react-native-purchases` y su config plugin; producto de suscripción en Play Console.
   - En `src/hooks/use-premium.ts`, leer la suscripción activa de RevenueCat en vez de devolver `true`.
   - Cambiar `premium.enforced` a `true` en `src/constants/config.ts`.
   - Pantalla de paywall (`src/app/premium.tsx`) que se abre desde el aviso de límite de recetas.
2. **Qué cobrar** (sugerencia): recetas ilimitadas (gratis: 10), estadísticas de tareas, varias listas de mercado, recordatorios.
3. **Anuncios (AdMob)**: opcional y secundario; un banner en Recetas. Requiere build nuevo.

## Fase 5 · Ideas para crecer
- Recordatorios de tareas (expo-notifications; requiere build).
- Cantidades en productos ("2 litros").
- Historial de compras y gasto mensual.
- Compartir lista del mercado por WhatsApp (`Share` de react-native).
