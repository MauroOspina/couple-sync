# Couple Sync · guía para agentes

App Expo (SDK 57) + Expo Router + Supabase para parejas: despensa, mercado, recetas y tareas del hogar. Objetivo: publicarla y monetizarla en Google Play (Android). Textos de la app en español.

## Comandos
```bash
npm run check               # lint + tipos + tests: córrelo SIEMPRE antes de terminar
npx expo start              # servidor de desarrollo (Expo Go SDK 57)
npx expo install <paquete>  # nunca npm install <paquete>: resuelve versiones compatibles
```
Si agregas o renombras una ruta en `src/app/`, corre `npx expo start` una vez: regenera los tipos de rutas.

## Mapa del código (`src/`)
| Carpeta | Qué va ahí |
|---|---|
| `app/` | Rutas. `_layout.tsx` decide login / setup / pestañas. `(tabs)/` = Despensa (`index`), `mercado`, `recetas`, `tareas`, `hogar` |
| `components/ui/` | Kit visual: `AppText`, `Button`, `Card`, `Chip`, `TextField`, `Sheet`, `Icon`... Úsalo siempre |
| `components/<feature>/` | Piezas de cada pantalla (inventory, recipes, chores) |
| `domain/` | Lógica pura y tipos, sin React ni Supabase. Con tests en `__tests__/` |
| `services/` | Supabase y caché local. Un *adapter* por tabla (`products.ts`, `chores.ts`, `recipes.ts`) |
| `providers/` | Estado global: `useSession`, `useInventory`, `useChores`, `useRecipes` |
| `hooks/` | `useSyncedCollection` (sync offline + tiempo real), `makeStyles`/`useAppTheme`, `usePremium` |
| `constants/` | `theme.ts` (colores, fuentes, espacios), `catalog.ts`, `config.ts` (links, Premium) |

Base de datos: `supabase/schema.sql` (idempotente). Páginas legales: `docs/` (GitHub Pages).

## Reglas
- **Estilos**: nada de colores sueltos. Usa `makeStyles(theme => ...)` y los tokens de `constants/theme.ts`. La app tiene modo claro y oscuro.
- **Texto**: `AppText` con `variant`/`tone`, no `<Text>`. Íconos con `<Icon name=...>`; para uno nuevo agrégalo al mapa de `components/ui/icon.tsx`.
- **Lógica nueva**: función pura en `domain/` + test en `domain/__tests__/`. Las pantallas solo llaman a providers.
- **Datos nuevos** (tabla nueva): tabla + RLS en `supabase/schema.sql` → adapter en `services/` → provider con `useSyncedCollection` → pantalla. Copia el patrón de `recipes`.
- **OTA vs build**: cambios solo JS/TS se publican solos por OTA al hacer push. Una librería con código nativo (AdMob, RevenueCat, notificaciones...) exige un build nuevo y subir `version` en `app.json`. **No cambies `version` en otro caso**: las actualizaciones dejarían de llegar.
- `ios/` y `android/` no existen (CNG): configura en `app.json`.
- No hagas `git push` ni ejecutes nada contra Supabase: eso lo hace la persona.

## Ramas y publicación
- `git push origin <rama>:preview` → OTA al canal preview (APK de prueba).
- `git push origin main` → OTA a producción. El workflow corre `npm run check` antes de publicar.
