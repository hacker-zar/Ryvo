---
name: ryvo-qr-materials
description: Genera el QR y la tarjeta (frente/dorso) para el LOCAL FÍSICO de un negocio que YA existe y tiene página publicada en RYVO, reutilizando su identidad visual real (logo, colores, tipografía) y su URL pública real — nunca inventa marca ni URL. Dos modos — GENERATE MODE (a partir de un negocio real, produce cartel A4/A5 + tarjeta listos para imprimir) y REVIEW MODE (audita un material ya hecho: QR chico, bajo contraste, logo ilegible, texto chico, exceso de info, márgenes/alineación). Usar cuando el usuario pida el QR/cartel/tarjeta de un negocio para el mostrador o para entregar a clientes (ej. "generá el QR y la tarjeta de Fernando Puliotti", "necesito un cartel para el local de bella-vista", "revisá este cartel que hicimos"). No depende de la skill `ryvo-onboarding` (esa es para dar de alta negocios nuevos) — requiere también el contexto general del proyecto (skill `ryvo`), cargarlo si no está ya en la sesión.
---

# RYVO — Materiales QR (cartel + tarjeta)

Genera, para un negocio que **ya tiene página publicada en RYVO**, dos
materiales listos para imprimir: un **cartel** (QR grande para el local,
A4/A5) y una **tarjeta** (frente identidad, dorso QR + contacto). El QR
siempre apunta a `/<slug>?reservar=1` del negocio — la misma URL que ya
usa el QR del sitio público (ver `Contact.tsx` / skill `ryvo`), así que
escanearlo abre directo el modal de reserva.

**Regla central de toda la skill**: la identidad visual y los datos de
contacto salen SIEMPRE de RYVO (Supabase), nunca se inventan. Si algo no
está cargado (logo, Instagram, WhatsApp), el material se genera igual con
un respaldo neutro y se le avisa al usuario qué falta — no se rellena con
un valor inventado ni se le pone un dato "razonable".

## Los dos modos

| Modo | Qué hace | Toca producción |
|---|---|---|
| **GENERATE** | Localiza un negocio real, arma su paleta/tipografía, genera QR + cartel + tarjeta, valida el QR, muestra preview | No — solo lee (`business-repository.ts`/RLS público, misma anon key que el sitio) |
| **REVIEW** | Audita un material ya existente (imagen) contra el mismo checklist de legibilidad/consistencia | No |

## Antes de arrancar (una sola vez por sesión)

Los scripts viven en `scripts/` dentro de esta skill y corren con Node
plano (sin build de Next.js). Requieren que el repo tenga
`.env.local` con `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
— son de solo lectura (misma anon key que usa el sitio público, respeta
RLS), así que nunca pueden crear, editar ni publicar un negocio.

## GENERATE MODE — flujo

```
Negocio RYVO (slug/nombre/id/URL)
        │
        ▼
1. resolve-business.js  → identidad real + URL pública + qué falta
        │
        ▼
2. Si es ambiguo (varios negocios con nombre parecido) o no se
   encontró → preguntarle al usuario cuál es, o pedirle el slug/URL
   exacto. Si published:false → avisar antes de seguir.
        │
        ▼
3. generate-materials.js → cartel (A4+A5) + tarjeta (frente+dorso) + manifest.json
        │
        ▼
4. validate-qr.js → si falla algún check, NO mostrar el resultado
   como final: diagnosticar (casi siempre es un dato de origen, no
   un bug del script) y volver a generar.
        │
        ▼
5. Mostrar preview: leer los .png generados (tool Read, son imágenes)
   y mirarlos vos mismo antes de entregarlos — los checks automáticos
   no reemplazan mirar el diseño.
        │
        ▼
6. Entregar con SendUserFile + resumen de qué se usó y qué falta
   (logo/Instagram/WhatsApp si no estaban cargados), y recordarle al
   usuario escanear el PNG final con un celular real antes de mandarlo
   a imprimir en cantidad (ver "Límites de la validación" abajo).
```

### 1. Localizar el negocio

```bash
node scripts/resolve-business.js --slug bella-vista
node scripts/resolve-business.js --name "Fernando Puliotti"
node scripts/resolve-business.js --id <uuid>
node scripts/resolve-business.js --url https://ryvo-arg.vercel.app/bella-vista
```

Devuelve JSON por stdout: `found`, `business` (columnas públicas — nunca
incluye el hash de contraseña), `publicUrl`, `bookingUrl`,
`siteUrlSource` (de dónde salió el dominio: env var o el dominio de
producción conocido, ver `references/branding-fields.md`), `missing`
(campos vacíos) y `warnings`. Con `--name`, si hay más de un negocio que
matchea devuelve `candidates` para que decidas con el usuario en vez de
adivinar cuál es.

Guardá la salida a un archivo — la usa el siguiente paso:

```bash
node scripts/resolve-business.js --slug bella-vista > /tmp/business.json
```

Si `found:false`, no sigas: pedile al usuario el slug/nombre exacto, o
si el negocio realmente no existe en RYVO todavía, esto no es la skill
correcta (ver `ryvo-onboarding`).

### 2. Generar los materiales

```bash
node scripts/generate-materials.js --input /tmp/business.json --out /tmp/materiales/<slug>
```

Genera (300dpi, listos para imprimir):

- `poster-a4.svg`/`.png`, `poster-a5.svg`/`.png` — mismo diseño, dos
  tamaños (A4 y A5 comparten proporción ISO 216, por eso es un solo
  template).
- `card-front.svg`/`.png`, `card-back.svg`/`.png` — tarjeta 89×51mm.
- `manifest.json` — registro de cada decisión tomada (paleta resuelta,
  colores del QR, si se usó logo real o monograma, warnings) — es lo
  que lee `validate-qr.js` y lo que tenés que citarle al usuario al
  explicar qué se generó.

Flags opcionales: `--poster a4` (o `a5`, o `a4,a5`) para generar solo
algunos tamaños; `--card no` para omitir la tarjeta.

Si `sharp` no está disponible en `node_modules` (dependencia opcional
de Next.js, no está en `package.json` — ver
`references/branding-fields.md`), el script igual genera los `.svg`
pero no puede rasterizar a `.png`; avisalo en vez de fallar en silencio.

### 3. Validar el QR

```bash
node scripts/validate-qr.js --manifest /tmp/materiales/<slug>/manifest.json
```

Chequea (todo programático, ver "Límites de la validación" más abajo):
la URL codificada es exactamente la `bookingUrl` real (no una inventada
ni de otro negocio), nivel de corrección `H`, quiet zone ≥4 módulos,
contraste ≥7:1, y que el QR impreso mida al menos ~25mm (cartel) o
~20mm (tarjeta) de lado a tamaño real — no solo en píxeles de pantalla.
`ok:false` → **no entregues el material como terminado**: leé
`failedChecks`, el problema casi siempre es de los datos de origen
(ej. un `primary_color` clarísimo) y ya está resuelto por el fallback a
negro/blanco — si igual falla, es una señal real de revisar antes de
imprimir.

### 4. Preview y entrega

Usá `Read` sobre los `.png` generados para mirarlos vos mismo (son
imágenes, se ven directo) antes de mostrárselos al usuario — los tres
checks (`validate-qr.js` + mirar el PNG + pedirle al usuario que escanee
el resultado con el celular) son las tres capas de verificación de esta
skill, ninguna alcanza sola. Contale al usuario, en base al
`manifest.json`:

- Qué se generó y con qué datos reales (paleta, tipografía, si usó logo
  real o monograma).
- Qué falta en RYVO (`missing`) y por qué el resultado sería mejor si
  se completa (ej. "no tiene logo cargado, uso un círculo con la
  inicial — subilo en el editor para un resultado más prolijo").
- Cualquier warning del manifest (ej. colores reemplazados por
  contraste insuficiente, negocio no publicado todavía).

Después entregá los archivos con `SendUserFile` (los `.png` para
imprimir directo, los `.svg` por si alguien los quiere retocar en un
editor de diseño).

## Límites de la validación — sé honesto sobre esto con el usuario

No hay lector de cámara real en este entorno: `validate-qr.js` confirma
todo lo que se puede confirmar sin escanear (URL correcta, contraste,
margen, nivel de corrección, tamaño físico a la resolución de
impresión) — pero **no es un escaneo real**. Se investigó decodificar
el PNG con la Shape Detection API del navegador (`BarcodeDetector`)
como verificación adicional automática; no está disponible en el
Chromium de este entorno, así que no es una capacidad real de esta
skill (no la ofrezcas como si lo fuera). El último paso de verificación
real es que el usuario escanee el PNG final (o una impresión de prueba)
con su propio celular antes de imprimir en cantidad — pedíselo
explícitamente, no lo des por hecho.

## REVIEW MODE

El usuario pasa un material ya hecho (imagen — con `Read` la ves
directo) y pide revisarlo. Usá el mismo criterio que
`validate-qr.js`/las reglas de diseño de `generate-materials.js`, pero a
ojo sobre la imagen:

- **QR**: ¿tiene margen blanco alrededor (quiet zone)? ¿el negro sobre
  blanco (o el color usado) se ve con buen contraste, sin degradés ni
  texturas encima? ¿ocupa una porción razonable del material (no un
  QR miniatura perdido en una esquina)?
- **Logo**: ¿se lee a tamaño real de impresión, o es una imagen
  pixelada/borrosa estirada de más?
- **Texto**: ¿el CTA y el nombre del negocio se leerían a la distancia
  real de uso (cartel: desde ~1-2m; tarjeta: en la mano)? Texto de
  adorno microscópico es un problema aunque "quede prolijo" en pantalla.
- **Exceso de información**: ¿hay más de un CTA, o texto que no aporta
  (dirección completa + teléfono + mail + horarios + redes, todo
  junto)? La regla del negocio es minimalismo, no un flyer completo.
- **Márgenes/alineación**: elementos pegados al borde de la hoja/tarjeta,
  o descentrados sin que sea una decisión de diseño evidente.
- **Consistencia con la identidad real**: compará contra lo que devuelve
  `resolve-business.js` para ESE negocio — si el material usa colores o
  tipografía que no coinciden con lo cargado en RYVO, marcalo (puede ser
  un material viejo de antes de un cambio de paleta, o hecho a mano sin
  mirar el editor).

Entregá el resultado como una lista concreta de hallazgos (qué está mal,
por qué importa, cómo se vería arreglado) — no hace falta regenerar el
material vos mismo salvo que el usuario lo pida explícitamente.

## Reglas duras (no negociables)

- Nunca inventar logo, colores, tipografía, Instagram, WhatsApp,
  teléfono o URL — si no está en RYVO, no está en el material. Un dato
  faltante se resuelve con un respaldo neutro (monograma con la
  inicial) + aviso explícito, nunca con un placeholder que parezca real.
- La URL del QR es siempre `resolve-business.js` → `bookingUrl` real de
  ESE negocio — nunca escribirla a mano ni reusar la de otro negocio.
- No modificar el negocio en Supabase — estos scripts son de solo
  lectura (misma anon key pública que el sitio, respeta RLS); si en
  algún momento hiciera falta escribir algo, no es esta skill.
- No sacrificar legibilidad del QR por estética — ver
  `pickReadableAccent`/`pickQrColors` en `scripts/lib/color.js`: el
  color de marca se usa siempre que contraste alcance, y cae a
  negro/blanco o al color de texto curado cuando no.
- No implementar en esta versión: pedidos a imprenta, pagos, ni
  automatizar la impresión física — el alcance es "PNG/SVG listos para
  que alguien los mande a imprimir", no el circuito de impresión en sí.

## Referencias

- `references/branding-fields.md` — de qué campo de RYVO sale cada
  elemento visual del material (tabla), y las decisiones de fallback
  documentadas (dominio de producción, aproximación tipográfica,
  paleta oscuro/claro) para quien tenga que mantener los scripts.
- `scripts/lib/` — cada archivo tiene un comentario de cabecera
  explicando qué replica de la app real (`color.js` ~
  `src/lib/format.ts`, `appearance.js` ~ `src/lib/appearance-presets.ts`,
  `icons.js` ~ `src/components/Contact.tsx`) y por qué está duplicado
  en vez de importado (estos scripts corren con Node plano, sin el
  loader de TypeScript/JSX de Next.js) — si cambia el original, replicar
  el cambio acá.
