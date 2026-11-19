# Roadmap · Nest hacia Google Play

Cada tarea de Cline va en una **conversación nueva** (botón +). Al terminar, revisa el diff y haz commit tú.

## ▶ Retomar aquí · estado al 18 nov 2026
`main` tiene 5 commits sin subir (nombre Nest, compartir receta → Nest, pegar receta de la IA, script de sugerencias, perfil `production-apk`). La versión es **1.1.0** y trae código nativo (`expo-share-intent`): **necesita build nuevo**, a la 1.0.0 no le llega por OTA. Buzón de sugerencias: vacío desde el 11 nov.

**A · Sacar la 1.1.0 (en este orden)**
1. [x] **SQL**: Supabase → SQL Editor → pega todo `supabase/schema.sql` → Run (agrega `repeat_every` y `repeat_weekdays` a `chores`). Si la app sale antes que el SQL, las tareas dejan de sincronizar. Se puede correr varias veces.
2. [x] **Preview**: `git push origin main:preview` + build de prueba (`production-apk` o preview) e instalarlo.
3. [x] **Probar en el teléfono**: las 5 pestañas, sincronización entre dos teléfonos, compartir una receta desde Gemini → Nest, teclado en Android (que no tape los campos).
4. [x] **Eliminar cuenta** con una cuenta de Google de prueba (no la tuya): Hogar → Eliminar mi cuenta. Puede fallar por permisos sobre `auth.users`.
5. [x] **Producción**: `git push origin main`.

**B · Bloqueos de Google Play** (ver Fase 2)
- [x] Correo de contacto en `docs/` (también corregir "Couple Sync" en el asunto del mailto de `docs/delete-account.html`).
- [x] GitHub Pages: activo, las dos páginas cargan.
- [ ] OAuth publicado, Play Console, prueba cerrada.

**C · Siguiente en la app**: ver Fase 5 (cantidades, historial de compras) o Fase 4 (Premium, requiere build).

## Fase 2 · Requisitos de Google Play (tú)
- [x] **Correo de contacto**: reemplaza `CORREO_DE_CONTACTO` en `docs/privacy.html` y `docs/delete-account.html` por un correo personal.
- [x] **GitHub Pages**: repo → Settings → Pages → Branch `main`, carpeta `/docs`. Las URLs quedan como en `src/constants/config.ts`.
- [ ] **Google OAuth**: Google Cloud Console → pantalla de consentimiento → "Publicar app" (en modo prueba solo entran 100 usuarios).
- [x] **Ícono y splash propios**: hechos con el cambio a Nest (ver `assets/brand/README.md`).
- [ ] **Play Console** ($25, cuenta personal) → crear app → ficha de tienda (capturas, descripción, *feature graphic* 1024×500) → formulario *Data safety* (correo y nombre; datos cifrados en tránsito; se pueden borrar).
- [ ] **Build de producción**: `npx eas-cli@latest build --profile production --platform android` → sube el `.aab` a *Prueba cerrada*.
- [ ] **Prueba cerrada**: 12 testers durante 14 días seguidos. Luego, solicitar producción.

## Fase 3 · Mejoras rápidas ✅ (18 nov 2026)
Hechas: pull to refresh (Despensa y Mercado), deshacer al terminar el mercado, buscar recetas, elegir categoría si un producto nuevo del mercado cae en "Otros", compartir la lista del mercado (botón en el encabezado).

## Lista del mercado separada del estado (19 nov 2026)
- Solo "Falta" entra sola a la lista. "Queda poco" y lo que se quita con "No comprar esta vez" quedan en "Fuera de la lista" (al final del Mercado). Al cambiar el estado se olvida esa decisión. Columna `products.on_list`.
- **Antes de publicar**: correr `supabase/schema.sql` (si la app sale antes, los productos dejan de sincronizar).

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
- Historial de compras y gasto mensual (pospuesto).
