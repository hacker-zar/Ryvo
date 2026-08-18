# RESEARCH MODE

Investigación pública de un negocio, antes de pedirle datos al cliente.
Entra en este modo cuando el usuario da solo identificadores públicos
(Instagram, web, Google Maps, Facebook, TikTok, o "buscá lo que haya de
[negocio]") — ver "Cómo elegir el modo" en `SKILL.md`.

**Resultado de este modo**: un informe de confianza, cero cambios en
producción. El informe alimenta el paso 1 de `onboarding-mode.md`; no es
un sistema de carga alternativo.

Este archivo (pasos 1-9 de abajo) es también, literalmente, lo que
ejecutan las Fases A-C de `complete-mode.md` — no lo dupliques ahí,
solo referencialo.

## Reglas específicas de este modo

- 100% investigación pública, sin login. No te loguees en Instagram,
  Facebook, Google ni ningún otro servicio para acceder a más datos, y no
  intentes resolver ningún CAPTCHA o muro de acceso — si una fuente lo
  pide, marcala como no accesible y seguí con las demás.
- Usar el Browser pane sandboxeado (`mcp__Claude_Browser__*`) o
  `WebSearch`/`WebFetch` para navegar las fuentes. **No uses Claude in
  Chrome** para esto — esa superficie es la sesión real del usuario,
  reservada para el paso de carga en producción (`onboarding-mode.md`);
  mezclarla acá no aporta nada y expone esa sesión a sitios de terceros
  sin necesidad.
- No descargues ni reutilices imágenes automáticamente. Describilas y
  enlazá la fuente; la decisión de qué usar es del usuario en la
  confirmación.
- No copies descripciones largas tal cual (derechos de autor) — parafraseá,
  y si citás algo puntual que valga la pena, que sea corto y con la fuente.
- Nunca elijas arbitrariamente entre dos fuentes que dicen cosas distintas.
  Reportá el conflicto, no lo resuelvas vos.
- Nunca inventes ni completes con un valor "razonable" un dato que no
  encontraste. Si no está, es ❌ NO ENCONTRADO.

## Flujo

1. **Recibir identificadores públicos** del negocio: Instagram, web, Maps,
   Facebook, TikTok, o cualquier otro dato público que el usuario tenga.
2. **Investigar las fuentes disponibles** — visitar cada identificador
   dado, y buscar (`WebSearch`) el negocio por nombre/ciudad para
   encontrar fuentes adicionales no mencionadas (ficha de Google Business,
   reseñas, directorios locales).
3. **Extraer y normalizar** todo lo encontrado a los mismos campos que usa
   `onboarding-mode.md`:
   - Negocio: nombre, descripción, categoría, dirección, ciudad, teléfono,
     whatsapp, instagram, facebook, tiktok, web, link de reservas existente.
   - Servicios: nombre, descripción, precio, duración (si aparece),
     promociones (si aparecen).
   - Horarios: días de atención, apertura/cierre, pausas, horarios
     especiales.
   - Profesionales: nombre, rol/especialidad, info pública disponible.
   - Imágenes: identificar (sin descargar) candidatas a logo, foto
     principal/hero, fotos del local, fotos de trabajos, fotos de
     profesionales, galería — con descripción corta + URL de origen.
4. **Comparar entre fuentes** — para cada dato, ver si coincide en todas
   las fuentes donde aparece.
5. **Detectar contradicciones** — mismo dato, valores distintos entre
   fuentes → conflicto, no promedio ni "la fuente más nueva gana" salvo
   que sea obvio por fecha explícita (ej. "válido desde marzo 2026").
6. **Marcar cada dato** con uno de estos tres estados (ver más abajo).
7. **Identificar faltantes** — qué campos necesita `onboarding-mode.md`
   que acá quedaron en ❌ o ⚠️.
8. **Mostrar el informe** (formato abajo) antes de tocar nada en
   producción.
9. **Solo después de la aprobación del usuario**, pasar los datos
   aprobados a `onboarding-mode.md` (paso 1: ya no arranca de cero, arranca
   de este resultado).

## Regla de confianza

Cada dato individual (no cada sección) lleva uno de estos tres estados:

- **✓ CONFIRMADO** — aparece en al menos una fuente pública confiable,
  sin contradicción con ninguna otra fuente consultada.
- **⚠️ REQUIERE CONFIRMACIÓN** — aparece pero de forma ambigua, en una
  sola fuente débil (ej. un comentario suelto), con pinta de estar
  desactualizado, o **en conflicto entre fuentes**.
- **❌ NO ENCONTRADO** — no aparece en ninguna fuente consultada.

Ante un conflicto entre fuentes, nunca elegir una arbitrariamente. Ejemplo:

```
Precio corte:
- Instagram: $12.000
- Web: $15.000

⚠️ CONFLICTO — confirmar precio actual.
```

Mismo criterio para horarios, dirección, teléfono, servicios, etc.

## Formato del informe

```
RYVO ONBOARDING RESEARCH — <nombre o identificador dado>

NEGOCIO
✓ Nombre
✓ Instagram
✓ Dirección
⚠️ Teléfono (solo en un comentario de Google Maps, sin confirmar)
❌ Categoría

SERVICIOS
✓ Corte
✓ Barba
⚠️ Precio del corte — CONFLICTO
✓ Corte + barba

HORARIOS
⚠️ Encontrados pero necesitan confirmación (fuente: bio de Instagram, sin fecha)

PROFESIONALES
✓ Fernando
❌ No se encontraron otros profesionales

IMÁGENES (ninguna descargada — solo referenciadas)
✓ Logo encontrado (Instagram, foto de perfil)
✓ 8 imágenes potencialmente útiles
✓ 3 recomendadas para galería

FALTANTES
1. Confirmar precios
2. Confirmar horarios
3. Confirmar profesionales
4. Confirmar qué imágenes utilizar

CONFLICTOS
- Precio corte: Instagram indica $12.000, web indica $15.000
  → Requiere confirmación

FUENTES CONSULTADAS
- Instagram: <url>
- Web: <url>
- Google Maps: <url>
- (marcar acá también las fuentes que se intentaron y no fueron
  accesibles, con el motivo: login requerido, no existe, etc.)
```

Ajustar las secciones a lo que efectivamente se investigó — no forzar
todas las categorías si el negocio no tiene, por ejemplo, TikTok.

## Al terminar

Esperar la aprobación del usuario sobre el informe. Esa aprobación cubre
el paso de confirmación de `onboarding-mode.md` (no se vuelve a pedir una
segunda confirmación idéntica) — pero cualquier dato que haya quedado ⚠️
o ❌ se resuelve antes de usarlo para cargar producción: o el usuario lo
confirma/corrige ahí mismo, o se le pregunta directamente al cliente.
