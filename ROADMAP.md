# Roadmap · Nest hacia Google Play

Cada tarea de Cline va en una **conversación nueva** (botón +). Al terminar, revisa el diff y haz commit tú.

## ▶ Retomar aquí · estado al 18 nov 2026
`main` tiene 5 commits sin subir (nombre Nest, compartir receta → Nest, pegar receta de la IA, script de sugerencias, perfil `production-apk`). La versión es **1.1.0** y trae código nativo (`expo-share-intent`): **necesita build nuevo**, a la 1.0.0 no le llega por OTA. Buzón de sugerencias: vacío desde el 11 nov.

**A · Sacar la 1.1.0 (en este orden)**
1. [x] **SQL**: Supabase → SQL Editor → pega todo `supabase/schema.sql` → Run (agrega `repeat_every` y `repeat_weekdays` a `chores`). Si la app sale antes que el SQL, las tareas dejan de sincronizar. Se puede correr varias veces.
2. [x] **Preview**: `git push origin main:preview` + build de prueba (`production-apk` o preview) e instalarlo.
3. [x] **Probar en el teléfono**: las 5 pestañas, sincronización entre dos teléfonos, compartir una receta desde Gemini → Nest, teclado en Android (que no tape los campos).
4. [x] **Eliminar cuenta** con una cuenta de Google de prueba (no la tuya): Hogar → Eliminar mi cuenta. Puede fallar por permisos sobre `auth.users`.
5. [ ] **Producción**: `git push origin main`.

**B · Bloqueos de Google Play** (ver Fase 2)
- [ ] Correo de contacto en `docs/` (también corregir "Couple Sync" en el asunto del mailto de `docs/delete-account.html`).
- [ ] GitHub Pages: hoy la URL de privacidad da **404**.
- [ ] OAuth publicado, Play Console, prueba cerrada.

**C · Cuando haya tiempo**: mejoras de la Fase 3 (prompts listos para Cline).

## Fase 2 · Requisitos de Google Play (tú)
- [ ] **Correo de contacto**: reemplaza `CORREO_DE_CONTACTO` en `docs/privacy.html` y `docs/delete-account.html` por un correo personal.
- [ ] **GitHub Pages**: repo → Settings → Pages → Branch `main`, carpeta `/docs`. Las URLs quedan como en `src/constants/config.ts`.
- [ ] **Google OAuth**: Google Cloud Console → pantalla de consentimiento → "Publicar app" (en modo prueba solo entran 100 usuarios).
- [x] **Ícono y splash propios**: hechos con el cambio a Nest (ver `assets/brand/README.md`).
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

## Sugerencias de usuarios · nov 2026 (hecho en código)
Historial de tareas, deshacer, quién la hizo, periodicidad libre e ideas de recetas con IA. El SQL que necesitan está en el paso A.1 de "Retomar aquí".

Las ideas con IA no usan servidor ni llaves: arman una pregunta con la despensa y la abren en el Modo IA de Google
(`google.com/search?udm=50&q=...`, URL no documentada) o en el menú de compartir (Gemini, ChatGPT...), con la cuenta de cada persona.

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
