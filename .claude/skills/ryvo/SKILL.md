---
name: ryvo
description: Contexto operativo del proyecto RYVO — SaaS de presencia digital y reservas online para barberías/peluquerías (Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase). Usar SIEMPRE antes de escribir o modificar código, diseñar UI, tocar Supabase/RLS, trabajar en el flujo de reservas, el panel /admin, o responder preguntas sobre arquitectura, componentes o roadmap de RYVO — incluso si el usuario no dice "RYVO" explícitamente, alcanza con que mencione barbería, peluquería, turnos, reservas/booking, o que el trabajo sea dentro de este repositorio. No asumir nada sobre la arquitectura sin leer esto primero: evita releer todo el código para reconstruir contexto que ya está acá.
---

# RYVO

SaaS que le da a una barbería/peluquería chica una web profesional + reservas
online propias, con onboarding asistido (nosotros cargamos sus datos) y
soporte humano. El dueño no debe necesitar ser técnico. Estamos en etapa de
demo/validación con negocios reales — prioridad: calidad visual y que nada
se rompa en vivo, no sumar features.

## Stack y arquitectura

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase +
`qrcode.react`. Tres zonas de ruteo, cada una con su propia identidad:

| Ruta | Qué es | Notas |
|---|---|---|
| `/` | Landing de RYVO como producto | Componentes `marketing/*`, paleta graphite/porcelain/signal (tech, no "barbería") |
| `/[slug]` | Sitio público de un negocio | Multi-tenant vía `slug`/`business_id`, paleta cuero+bronce por defecto |
| `/admin`, `/admin/negocios/[id]` | Panel del dueño | Sesión con rol: superadmin (RYVO) o dueño de un negocio puntual — ver "Admin" abajo |

**Multi-negocio**: `getBusinessProfile(slug)` en
[`src/lib/data/business-repository.ts`](src/lib/data/business-repository.ts)
es el único punto de acceso a datos. Ningún componente de negocio tiene
datos hardcodeados — todo llega por props. Si Supabase no está configurado
(sin `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`), cae automáticamente a modo demo
con el fixture `demoBusiness` (slug `bella-vista`) en
[`src/lib/data/demo-business.ts`](src/lib/data/demo-business.ts). Cualquier
cambio en el repository debe seguir funcionando en ambos modos.

**Estructura clave**: `src/app` (rutas), `src/components` (públicos, `booking/*`,
`admin/*`, `marketing/*`), `src/lib` (`data/`, `actions/`, `admin/`), `src/types/business.ts`
(tipos — reflejan 1:1 `supabase/schema.sql`, mantener sincronizados).

## Design system

- **Paleta negocio** (`globals.css`): `--ink`/`--bone`/`--brass` (cuero +
  bronce cálido), sobrescribible por negocio vía `AppearanceScope`
  (`background_color`, `text_color`, `primary_color` → variable `--brass`).
- **Paleta plataforma** (marketing): `--graphite`/`--porcelain`/`--signal` —
  deliberadamente distinta, para que RYVO se lea como software, no como "una
  barbería más".
- **3 presets de tipografía** (`clasica`/`moderna`/`elegante`) y **3 estilos
  de botón** (`redondeado`/`suave`/`recto`), aplicados vía `data-*` en
  `AppearanceScope` — no hay libertad total de fuente/radio, son presets
  cerrados a propósito.
- Utilidades de marca: `.section-eyebrow`, `.section-title`, `.display-title`,
  `.ticket-number` (el numerito tipo ticket de espera es el elemento
  distintivo del sitio — úsalo para numerar, no un bullet genérico).
- `readableTextColor()` en `src/lib/format.ts` calcula contraste WCAG contra
  el `primary_color` que el dueño elige libre con un `<input type="color">` —
  úsala siempre que se pinte texto sobre `primary_color`, nunca asumas que un
  tono fijo (oscuro o claro) va a contrastar bien. `contrastRatio()` (mismo
  archivo) devuelve el ratio numérico WCAG entre dos colores — usado en
  `AppearanceForm` para avisar (no bloquear) si la combinación elegida
  contrasta poco.

## Reservas (lo más sensible del producto)

Wizard de 3 pasos + éxito (`BookingModal` → `StepService` → `StepDateTime` →
`StepDetails` → `StepSuccess`), abierto vía `useBookingModal()`
(`booking-modal-context.tsx`). El QR de cada negocio apunta a
`/<slug>?reservar=1`, que abre el modal automático — **el caso de uso
principal es alguien reservando desde el celular parado frente al local**;
diseña y proba mobile-first, siempre.

Disponibilidad = horario de apertura del local (`generateSlotsForDay`) menos
reservas activas (`filterAvailableSlots`), en
[`src/lib/availability.ts`](src/lib/availability.ts). Doble defensa
anti-duplicados: chequeo en la app antes de insertar + índice único
`bookings_no_duplicate_slot` en la base. Soporta multi-local; si un negocio
no tiene filas en `locations` usa un "local virtual" armado desde
`businesses.opening_hours` (compatibilidad hacia atrás, no romper).

⚠️ Bug conocido, no arreglado salvo pedido explícito: `generateSlotsForDay`
no excluye horarios ya pasados cuando la fecha elegida es hoy.

## Admin — aislamiento multi-tenant real

Dos roles de sesión, codificados y firmados (HMAC) en la cookie
`admin_session` (`src/lib/admin/session.ts`, tipo `AdminSession`):

- **`super`** — RYVO, autentica contra `ADMIN_PASSWORD` (env var, sin
  negocio asociado). Puede gestionar cualquier negocio y es el único rol
  que puede crear negocios nuevos (`adminCreateBusiness`).
- **`owner`** — el dueño de UN negocio puntual, autentica contra la
  contraseña propia de ESE negocio (`businesses.admin_password_hash`, hash
  scrypt). Solo puede gestionar ese negocio — intentar entrar a
  `/admin/negocios/<otro-id>` lo rebota a su propio negocio, nunca muestra
  ni filtra datos ajenos.

**Regla de oro**: toda server action de `src/lib/admin/actions.ts` y
`gallery-actions.ts` que reciba un `businessId` DEBE arrancar con
`await requireAdminFor(businessId)` (de `src/lib/admin/authorize.ts`) —
nunca alcanza con "hay alguna sesión válida". Antes de este cambio, esa
era exactamente la vulnerabilidad crítica: cualquier sesión podía tocar
cualquier negocio. No la reintroduzcas.

Login escopeado: "¿Trabajás aquí?" en el sitio público (ahora en el
footer) → `/admin/entrar?from=<slug>` (route handler) → si la sesión ya
puede gestionar ESE negocio, directo a `/admin/negocios/<id>`; si no, a
`/admin/login?business=<slug>`, que autentica contra la contraseña de ese
negocio puntual, no la de RYVO. Sin `?business=`, `/admin/login` es el
login de superadmin. `/admin` (listado de todos los negocios + "crear
negocio") es exclusivo de superadmin — un `owner` que llega ahí se rebota
directo a su propio negocio.

`/admin/negocios/[id]/page.tsx` es el editor completo del negocio: acceso
(`AdminPasswordForm` — fijar/cambiar la contraseña propia del negocio),
datos básicos (`BusinessEditForm`), apariencia (`AppearanceForm`),
locales/horarios (`LocationsManager` + `WeekScheduleEditor`), galería
(`GalleryUploadField`), servicios (`ServicesManager`), profesionales
(`ProfessionalsManager`). `/admin/negocios/[id]/turnos/page.tsx` es una
página **distinta**: el listado de reservas (`BookingsList`). No son
intercambiables — ver "Incidentes reales" más abajo.

Escrituras admin usan `supabaseAdmin` (service role, salta RLS) desde
server actions — la autorización por negocio vive en la capa de
sesión/aplicación (`requireAdminFor`/`requireSuperAdmin`), no en RLS.

## Supabase y seguridad

Dos clientes en `src/lib/supabase.ts`, nunca intercambiables:

- `supabase` (anon key) — respeta RLS. Lecturas públicas + `insert` público
  de `bookings`/`reviews`. Es el único cliente que puede tocar código que
  corre en el navegador.
- `supabaseAdmin` (service role key) — salta RLS. **Solo** dentro de server
  actions ya protegidas por `requireAdmin()`. Nunca debe llegar al bundle de
  cliente; la env var nunca lleva prefijo `NEXT_PUBLIC_`. No la loguees, no
  la expongas en respuestas, no la nombres en comentarios de cliente.

RLS (`supabase/schema.sql`): lectura pública de `businesses`/`services`/
`locations`/`reviews`; insert público de `bookings`/`reviews`; todo lo demás
(crear/editar negocios, servicios, locales, gestionar turnos, subir
imágenes) requiere service role desde el server. RLS filtra por FILA, no
por columna — por eso `businesses.admin_password_hash` (hash scrypt de la
contraseña propia del negocio) se protege en la capa de queries, no en
RLS: **nunca** hacer `select("*")` sobre `businesses` fuera de las
funciones de auth de `business-repository.ts` — usar siempre
`BUSINESS_PUBLIC_COLUMNS` (constante ya definida ahí), porque cualquier
select que incluya el hash y termine como prop de un Client Component lo
serializa en el HTML/RSC payload aunque nada lo muestre.

## Convenciones de código de este repo

- Comentarios solo para el "por qué" no obvio (decisión de diseño, bug
  evitado, compatibilidad hacia atrás) — nunca para explicar el "qué", el
  código ya se escribe legible. Mirá cualquier archivo existente como
  referencia de tono.
- Componentes de negocio reciben todo por props; cero datos hardcodeados.
- Server actions viven en `src/lib/actions/*` (público) y `src/lib/admin/*`
  (protegidas). Toda acción admin arranca con `requireAdmin()`.
- Animaciones discretas y cortas (`fadeIn`, `slideUp`, transiciones de paso,
  `selectPulse`) — no rebotes ni animaciones largas; respetan
  `prefers-reduced-motion`.

## Ya implementado (no reconstruir)

Sitio público completo, booking wizard con disponibilidad real, apariencia
personalizable, admin completo (negocio/apariencia/locales/galería/
servicios/profesionales/turnos), multi-local, modo demo automático, y
aislamiento multi-tenant real entre negocios (sesión con rol +
`requireAdminFor` en cada acción — ver "Admin" arriba). El esquema real de
Supabase (`businesses/services/locations/bookings/reviews/professionals`)
está aplicado y verificado contra `supabase/schema.sql`.

**Profesionales** (`professionals` table, `Professional` type,
`src/components/Professionals.tsx`): señal de confianza en la web pública
(nombre, rol, bio, foto opcional con fallback de iniciales) — deliberada y
explícitamente **no** ligado al flujo de reservas, no hay "elegir
profesional" en el wizard. Se renderiza entre Servicios y Galería. Si se
llega a pedir en el futuro conectar profesionales con servicios/booking,
es un cambio de alcance nuevo, no una extensión trivial de esto.

## Roadmap — NO implementar sin pedido explícito

WhatsApp Booking, recordatorios automáticos, rebooking, waitlist, gestión de
reseñas más allá de mostrarlas, analytics, marketing, gift cards,
membresías, IA, optimización de agenda, gestión de empleados, pagos online,
inventario, fidelización, chat. Todo esto está fuera de alcance a propósito
(ver "Fuera de alcance" en `README.md`) — no prepares abstracciones "por si
después se necesita".

## Antes de tocar código

1. Identificá qué ruta/zona se ve afectada (marketing / sitio público /
   admin) — cada una tiene su propia paleta e identidad, no las mezcles.
2. Si el cambio toca `business-repository.ts` o cualquier lectura de datos,
   verificá que siga funcionando en modo demo (sin Supabase) y con Supabase
   real.
3. Si el cambio toca apariencia, tipografía o algo que "se ve igual para
   todos los negocios", preguntate si en realidad debería ser configurable
   por negocio en vez de global.
4. Antes de copiar contenido de un archivo a otro (dos páginas admin
   parecidas, dos componentes similares), confirmá que el archivo de
   destino sigue siendo el correcto después del copy-paste — ver el
   incidente real más abajo.

## Después de tocar código

- Cambios de UI/frontend: levantá el dev server y mirá el resultado en el
  navegador, en mobile y desktop — no alcanza con que compile o tipee bien.
- Cambios en el flujo de reservas: probá el wizard completo de punta a
  punta (elegir servicio → fecha/hora → datos → confirmar).
- Cambios en el repository o en tipos: confirmá que el modo demo
  (`bella-vista` sin Supabase) sigue rindiendo sin romperse.
- Cambios en `src/types/business.ts`: reflejalos también en
  `supabase/schema.sql`, y viceversa.

## Incidentes reales — no repetir

- **Página duplicada por copy-paste**: en un commit,
  `src/app/admin/negocios/[id]/page.tsx` (editor del negocio) quedó
  reemplazada por una copia exacta de `turnos/page.tsx` (listado de
  turnos), dejando todo el editor de negocio inaccesible sin que nada
  fallara en build ni en tipos. Si vas a duplicar o adaptar una página
  admin como base para otra, revisá el diff final del archivo que **no**
  pensás cambiar, no solo el que sí.
- No asumas "compila" = "funciona visualmente": este tipo de bug no lo
  agarra `tsc` ni `eslint`.
- **El código puede estar perfecto y el negocio seguir roto si la
  infraestructura no coincide**: hubo un período en que el proyecto de
  Supabase real tenía un esquema completamente distinto al que
  `business-repository.ts` esperaba (tablas en español, de una
  implementación anterior, nunca reemplazadas por `schema.sql`). Todo el
  código compilaba y tipeaba perfecto, pero cada query real fallaba en
  producción (404 silencioso). Si algo "no anda" pese a que el código se
  ve correcto, verificá el esquema real de Supabase antes de tocar código.

## DO NOT — requiere autorización explícita del usuario en el chat

- No implementar nada del roadmap (WhatsApp, IA, pagos, membresías, etc.)
  sin que el usuario lo pida en ese momento.
- No ejecutar migraciones de Supabase ni modificar `supabase/schema.sql`
  sin confirmación.
- No instalar dependencias nuevas sin confirmación.
- No hacer refactors grandes ni rediseños de arquitectura sin que se pidan.
- No commitear ni pushear sin instrucción explícita.
- No tocar variables de entorno, ni loguear/mostrar/compartir claves de
  Supabase (en especial la service role key).
- No agregar abstracciones "por si se necesitan después" para features del
  roadmap.
