# Nest 🏡

La despensa, el mercado, las recetas y las tareas del hogar, en sintonía con tu pareja.
App Android hecha con Expo (SDK 57), Expo Router y Supabase.

## Empezar
```bash
npm install
cp .env.example .env      # pon la URL y la anon key de Supabase
npx expo start            # abre con Expo Go (SDK 57)
```
La base de datos se crea ejecutando `supabase/schema.sql` en el SQL Editor de Supabase.

## Comandos
| Comando | Para qué |
|---|---|
| `npm run check` | Lint + TypeScript + tests. Correr antes de cada commit |
| `npx expo start` | Servidor de desarrollo |
| `npx eas-cli@latest build --profile production --platform android` | Build para Google Play (.aab) |

## Publicación
- Push a `main` → actualización OTA a producción (GitHub Actions, después de `npm run check`).
- Push a `preview` → OTA al canal de pruebas.
- Cambios nativos (librerías con código nativo, ícono, splash) → build nuevo con EAS.

## Documentación
- `AGENTS.md`: mapa del código y reglas (para personas y agentes de IA).
- `ROADMAP.md`: pasos para llegar a Google Play y monetizar.
- `docs/`: política de privacidad y eliminación de cuenta (GitHub Pages).
