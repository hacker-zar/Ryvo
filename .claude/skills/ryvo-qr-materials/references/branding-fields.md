# De dónde sale cada elemento visual del material

Todo lo que dibujan `generate-materials.js` y sus templates viene de una
sola fuente: el JSON que devuelve `resolve-business.js` (columnas
públicas de `businesses`, ver `BUSINESS_PUBLIC_COLUMNS` en
`src/lib/data/business-repository.ts`). Esta tabla es el mapeo completo
— si un material muestra algo que no está acá, es un bug, no una
decisión de diseño.

| Elemento del material | Campo RYVO | Si falta |
|---|---|---|
| Logo (cartel + frente de tarjeta) | `business.logo` | Monograma: círculo con la inicial del nombre, colores de la paleta real (`elevated`/`accent`/`line`) — nunca un logo genérico ni inventado |
| Nombre del negocio | `business.name` | — (siempre presente, es NOT NULL en el schema) |
| Colores base (fondo/texto) | `business.background_color`/`text_color`, con el mismo fallback que `AppearanceScope.tsx`: valor propio del negocio si está seteado, si no el preset curado (oscuro/claro) que le corresponda | Preset "oscuro" (el default de RYVO) |
| Color de acento (CTA, marca) | `business.primary_color` | Cae al `text_color` resuelto si no está seteado, o si no contrasta lo suficiente contra la superficie donde se pinta (ver `pickReadableAccent`) |
| Color del QR | Se deriva de `primary_color`: si contrasta ≥7:1 contra blanco se usa tal cual (QR de color de marca); si no, negro puro — nunca un color que arriesgue el escaneo | — |
| Tipografía | `business.typography_preset` (`clasica`/`moderna`/`elegante`) → aproximación con fuentes disponibles localmente (ver "Tipografía" abajo) | Preset "elegante" (el default del sitio) |
| CTA del cartel/tarjeta | Texto fijo ("Reservá tu turno" / "Escaneá para reservar") — no viene de RYVO, es texto de la skill, uno de los ejemplos del brief original | — |
| URL del QR / pie del cartel | `bookingUrl` = `<dominio>/<business.slug>?reservar=1`, la MISMA convención que usa `BusinessSite.tsx` para el QR del sitio público | — (el slug siempre existe) |
| Dominio de esa URL | `process.env.NEXT_PUBLIC_SITE_URL` si está seteado; si no, `https://ryvo-arg.vercel.app` (documentado como dominio real de producción en `references/onboarding-mode.md` de la skill `ryvo-onboarding` — no es un valor inventado) | — |
| Instagram (dorso de tarjeta) | `business.instagram` | No se muestra la fila (no se inventa un handle) |
| WhatsApp (dorso de tarjeta) | `business.whatsapp` (solo se muestra el ícono + "WhatsApp", no se imprime el número completo) | No se muestra la fila |
| Aviso "negocio no publicado" | `business.published === false` | — |

## Tipografía: por qué es una aproximación, no el original exacto

El sitio real carga Fraunces/Inter como variable fonts vía
`next/font/google` (`src/app/layout.tsx`) — son archivos generados en
build (`.next/static/media/*.woff2`, con nombre hasheado, no un asset
estable para reusar desde un script fuera del build). En vez de
perseguir pixel-perfect, `scripts/lib/fonts.js` usa la MISMA
degradación que ya declara `globals.css` para el momento antes de que
esas variable fonts carguen: Georgia/Times para los presets
serif (`clasica`/`elegante`) y Arial/Helvetica para `moderna`. Es una
aproximación honesta, no una identidad inventada — si en algún momento
hace falta fidelidad pixel-perfect con Fraunces real, hay que sumar los
archivos de fuente como asset de la skill y decírselo al usuario
explícitamente antes, no asumirlo.

## Paleta oscuro/claro: por qué no es cualquier hex

`business.background_color`/`text_color` no son color libre — el editor
(`AppearanceForm`) los resuelve a una de dos variantes curadas
(`oscuro`/`claro`, ver `src/lib/appearance-presets.ts`), cada una con su
propio par fondo+texto+superficie-elevada+línea ya afinado para
contrastar bien solo. `scripts/lib/appearance.js` replica exactamente
esa tabla (`BACKGROUND_VARIANTS`) más la misma regla de resolución que
`AppearanceScope.tsx`: el valor RAW guardado en `background_color`/
`text_color` gana si está seteado (algunos negocios cargados antes de
que existieran las 2 variantes tienen un hex propio, ej. `#1e1206`), y
`elevated`/`line` siempre salen del preset más cercano porque el
negocio nunca los elige directo. Si `appearance-presets.ts` cambia,
replicar el cambio en `scripts/lib/appearance.js`.
