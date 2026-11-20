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

**C · Siguiente en la app**: **Fase 6** (invitar con link → recordatorios + widget). Ideas pendientes de hablar: cantidades, menú de la semana, gastos compartidos, varias listas, vencimientos (Fase 5) y Premium (Fase 4).

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
- [x] `supabase/schema.sql` corrido con `on_list` (20 nov 2026).

## Fase 6 · Invitar con link, recordatorios y widget (plan del 20 nov 2026)
Orden: **6.1 sale por OTA** (no toca código nativo). **6.2 y 6.3 van juntas en un solo build** con `version` 1.2.0 (y luego `docs/app-update.json`). Cada tarea en una conversación nueva de Cline.

### 6.1 · Invitar con link (solo JS → OTA) · hecho 20 nov, falta probar en el teléfono
El esquema `couplesync://` ya está en el APK 1.1.0, así que basta JS + una página en `docs/`. Implementado: `domain/invite.ts`, `services/pending-invite.ts`, `app/+native-intent.tsx`, `hooks/use-invite-while-ready.ts`, `lib/share-invite.ts`, `docs/join.html`. Si Nest no está instalada, Chrome vuelve a `join.html?sin-app` y ofrece el APK de `app-update.json` (production) si tiene link.
- **`docs/join.html`**: lee el código de `location.hash` (`join.html#HOGAR-XXXXXXXX`; el hash nunca llega al servidor). Valida con `^HOGAR-[2-9A-HJ-NP-Z]{8}$`; si no cuadra, muestra "Link inválido". Muestra el código grande + botón copiar + botón **"Abrir en Nest"** con `intent://join?code=CODIGO#Intent;scheme=couplesync;package=com.couplesync.app;S.browser_fallback_url=<index.html codificado>;end`. Debe ser un botón (Chrome bloquea `intent://` sin toque). Debajo: "¿No tienes Nest? Instálala, inicia sesión y escribe el código". Mismo `style.css`.
- **`src/domain/invite.ts`** + test: `parseInviteCode(urlOrPath): string | null` (acepta `couplesync://join?code=...`, `/join?code=...`, mayúsculas/minúsculas, espacios) y `inviteLink(code)`.
- **`src/app/+native-intent.tsx`**: `redirectSystemPath({ path })` → si `parseInviteCode(path)` da código, lo guarda (`services/pending-invite.ts`, en AsyncStorage para que sobreviva al login) y devuelve `'/'`. Cualquier otra ruta se devuelve igual (no romper el login de Google ni "Compartir → Nest").
- **`setup.tsx`**: al abrir, si hay código pendiente, prellena el campo y muestra un `Banner` "Te invitaron a un hogar". Se borra al unirse.
- **Ya en un hogar** (`status === 'ready'`): si llega un código distinto al del hogar actual → `Alert` "Ya estás en «X». Para unirte a otro, primero sal en Hogar." y se borra. Si es el mismo, se ignora. Invitado (`isGuest`): pedir iniciar sesión.
- **Compartir**: `APP_CONFIG.links.join`; el mensaje de `hogar.tsx` (y el `Alert` de `setup.tsx` al crear) incluye el link **y** el código.
- **Probar**: en un APK (no Expo Go), con `adb shell am start -a android.intent.action.VIEW -d "couplesync://join?code=HOGAR-..."` y abriendo el link desde WhatsApp.

- Pendiente (opcional): el link muestra `mauroospina.github.io/couple-sync`. Opciones: dominio propio como dominio de GitHub Pages (`docs/CNAME`, los links viejos redirigen solos) u organización de GitHub (`<marca>.github.io`).

### 6.2 · Recordatorios de tareas (nativo → build) · hecho 20 nov, sin commit
Notificaciones **locales**: el teléfono las programa a partir de las tareas; no hace falta servidor ni Firebase.
Implementado: `domain/reminders.ts` (un aviso por día con todas las tareas de ese día), `services/reminders.ts`, `hooks/use-chore-reminders.ts`, `components/household/reminders-card.tsx` (chips "No / 7 a. m. … 8 p. m."), ícono `assets/images/notification-icon.png`, `version` 1.2.0. **Commitear solo después de subir la 6.1 a `main`**: con `version` 1.2.0 los OTA ya no llegan a la 1.1.0.
- `npx expo install expo-notifications` + plugin en `app.json` (ícono monocromo, color de `theme`).
- **`src/domain/reminders.ts`** + test: `planReminders(chores, myUserId, today, { hour })` → `{ id, choreId, title, body, date }[]`. Solo tareas sin hacer, asignadas a mí o sin asignar. Expande las recurrentes con `nextDueDate` hasta 14 días. Vencidas: un aviso hoy si la hora aún no pasó. Máximo 40.
- **Ajustes por teléfono** (AsyncStorage): activado y hora (por defecto 8:00). Tarjeta "Recordatorios" en Hogar: interruptor + chips de hora (7, 8, 9, 18, 20). Al activar, pedir permiso (Android 13+); si lo niega, explicarlo y dejarlo apagado.
- **Programar**: hook montado en `(tabs)/_layout.tsx`. Cuando cambian tareas o ajustes (debounce ~1 s): `cancelAllScheduledNotificationsAsync` + programar cada uno con disparador de fecha en el canal "recordatorios".
- **Tocar la notificación** abre la pestaña Tareas.
- Limitaciones aceptadas: si la pareja completa o crea una tarea con mi app cerrada, me entero al abrirla. Eso lo resuelve 6.4.

### 6.3 · Widget del mercado (nativo → build)
Con `react-native-android-widget` (maduro). `expo-widgets` de Expo en SDK 57 aún es experimental en Android.
- `npx expo install react-native-android-widget` + plugin en `app.json`: widget `Mercado`, tamaño 3×2 (redimensionable), `updatePeriodMillis: 1800000`, descripción e imagen de vista previa.
- **Entrada**: crear `index.ts` que importe `expo-router/entry` y llame `registerWidgetTaskHandler`, y cambiar `main` en `package.json`.
- **`src/widgets/market-widget.tsx`**: primitivas de la librería (`FlexWidget`, `TextWidget`), no componentes RN: aquí no aplican `AppText`/`makeStyles`, pero los colores salen de `theme.ts`. Muestra el nombre del hogar, hasta 8 productos de la lista que no estén en el carrito y "y N más". Tocar abre `couplesync:///mercado`.
- **Datos**: el handler lee la caché local de productos (la misma de `useSyncedCollection`; exponer un lector en `services/`). `widgetMarketItems(products)` en `domain/` + test, reutilizando `splitMarket`.
- **Actualizar**: `InventoryProvider` llama `requestWidgetUpdate` cuando cambian los productos (debounce, solo Android, en try/catch porque en Expo Go no existe).
- Limitaciones v1: solo lectura (no se marca desde el widget) y muestra lo último que vio el teléfono; lo que cambie la pareja con mi app cerrada aparece al abrirla.

### 6.4 · Después: avisos de lo que hace el otro (push)
"Tu pareja agregó 3 cosas al mercado", "te asignaron una tarea", widget al día con la app cerrada. Requiere Firebase (FCM) + credencial en EAS, tabla `push_tokens` + función de Supabase que envíe por Expo Push. Hablarlo antes de empezar.

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
