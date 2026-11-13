# Marca · Nest

- `icono-gemini.png`: ícono original (1024×1024, generado con Gemini). Fondo crema `#F4F0E5`.
- De ahí salen los PNG de `assets/images/`:
  - `icon.png`: la imagen tal cual (Play Store y Android viejos).
  - `android-icon-background.png`: crema sólido `#F4F0E5`.
  - `android-icon-foreground.png`: el dibujo al 72% y centrado, para que el recorte del teléfono no corte las hojas.
  - `android-icon-monochrome.png`: silueta blanca para los íconos temáticos de Android 13+.
  - `splash-icon.png`: el dibujo recortado; el fondo del splash es el mismo crema (en `app.json`).
  - `favicon.png`: 48×48.

Cambiar el ícono o el splash requiere un build nuevo (no llega por OTA).
