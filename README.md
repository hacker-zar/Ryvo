# RYVO — plantilla multi-negocio para peluquerías y barberías

Sitio único y reutilizable (Next.js + Tailwind + Supabase) para servir la
web de múltiples peluquerías/barberías, cada una identificada por su
`business_id` / `slug`, cambiando solo datos, no código.

## Estructura de rutas

- **`/`** — landing de RYVO como plataforma (`src/app/page.tsx` +
  `src/components/marketing/*`). No pertenece a ningún negocio puntual;
  presenta el producto y dirige al dueño a `/admin/login`.
- **`/admin`** y **`/admin/login`** — panel de administración (ver más
  abajo).
- **`/{slug}`** — página pública de cada peluquería/barbería (ver
  "Cómo funciona la multi-tenency").

## Stack

- **Next.js 16** (App Router, TypeScript) — punto de partida elegido porque
  el repo estaba vacío.
- **Tailwind CSS 4**
- **Supabase** (`@supabase/supabase-js`) — capa de datos, opcional en este
  momento (ver "Modo demo" abajo).
- **qrcode.react** — generación del QR de reservas.

## Cómo funciona la multi-tenency

Cada negocio se sirve en `/[slug]` (por ejemplo `/bella-vista`). La página
(`src/app/[slug]/page.tsx`) obtiene el `BusinessProfile` completo (negocio +
servicios + reseñas) a través de `getBusinessProfile(slug)` y se lo pasa a
los componentes de UI (`Header`, `Hero`, `Services`, `Booking`, `Gallery`,
`Reviews`, `Contact`, `Footer`). Ningún componente tiene datos hardcodeados:
todos reciben props.

## Modo demo vs Supabase

`src/lib/data/business-repository.ts` decide automáticamente la fuente de
datos:

- Si `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están
  configuradas → consulta Supabase.
- Si no → usa los datos de demostración locales en
  `src/lib/data/demo-business.ts` (slug `bella-vista`).

Esto permite desarrollar y ver el sitio funcionando sin tener un proyecto
de Supabase todavía.

### Conectar Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL editor (crea las tablas
   `businesses`, `services`, `locations`, `bookings`, `reviews`, sus
   políticas de RLS, y el bucket público `business-images` para las fotos).
3. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (esta última
   se encuentra en Project Settings → API → service_role — **nunca** debe
   llevar el prefijo `NEXT_PUBLIC_`, porque no debe llegar al navegador).
4. Cargar el primer negocio desde `/admin` (ver más abajo) — no hace falta
   tocar la base de datos a mano.

**Por qué se necesitan dos claves de Supabase:** la `anon key` es pública y
respeta las políticas de RLS (lectura de negocios/servicios, y creación de
reservas/reseñas desde el sitio). Crear o editar negocios, servicios, y
subir imágenes son operaciones administrativas que no están permitidas por
RLS al cliente anónimo — esas escrituras usan la `service_role key` desde
el servidor, y solo dentro de acciones ya protegidas por `ADMIN_PASSWORD`.

## Sistema de reservas

El botón **"Reservar turno"** (Header y Hero) abre un modal de 3 pasos sin
salir de la página:

1. **Servicio** — elegir uno de los servicios del negocio.
2. **Fecha, local y hora** — calendario de los próximos 14 días; si el
   negocio tiene un solo local se selecciona automáticamente y no se
   muestra selector; si tiene varios, aparece para elegir. Los horarios
   se calculan a partir del horario de apertura del local y la duración
   del servicio, excluyendo los que ya tienen una reserva activa.
3. **Datos personales** — nombre, teléfono/WhatsApp y email opcional, con
   un resumen antes de confirmar.

Al confirmar se muestra una pantalla de éxito dentro del mismo modal. El
QR de la página (sección Contacto) apunta a `/<slug>?reservar=1`, que abre
el modal automáticamente al cargar — pensado para el caso de uso principal:
alguien escaneando el QR desde el celular.

### Multi-local

La tabla `locations` soporta negocios con uno o varios locales. Si un
negocio no tiene filas en `locations` (por ejemplo, uno creado antes de
esta funcionalidad), el sistema arma automáticamente un "local virtual" a
partir de `businesses.opening_hours`, así no se rompe nada existente.

### Evitar reservas duplicadas

La disponibilidad se valida en dos capas:
1. La app consulta las reservas activas del negocio/local/fecha antes de
   insertar.
2. La base de datos tiene un índice único (`bookings_no_duplicate_slot`)
   que rechaza cualquier duplicado que se cuele por una condición de
   carrera, excluyendo reservas canceladas (un horario cancelado vuelve a
   quedar disponible).

## Panel de administración (`/admin`)

Permite crear/editar negocios y sus servicios sin tocar la base de datos a
mano. Protegido con un password simple compartido (sin login de usuarios
individuales — fuera de alcance del MVP).

1. Definir `ADMIN_PASSWORD` (la contraseña) y `ADMIN_PASSWORD_SECRET`
   (clave para firmar la cookie de sesión, cualquier string largo) en las
   variables de entorno.
2. Entrar desde la página pública del negocio con el link **"¿Trabajás
   aquí?"** (arriba a la derecha), o directo a `/admin/login`.
3. Requiere Supabase conectado para poder crear/editar — en modo demo el
   panel se ve pero avisa que hace falta configurar la base de datos.

### Acceso desde la página pública

El dueño/empleado no necesita conocer ni escribir `/admin`: en cada
página de negocio hay un link discreto **"¿Trabajás aquí?"** que lleva a
`/admin/entrar?from=<slug>` (un Route Handler, no una página visible).
Ese punto de entrada:

- Si ya hay sesión válida → redirige directo al editor (`/admin`), sin
  mostrar el login de nuevo.
- Si no → redirige a `/admin/login`, que al loguearse con éxito redirige
  automáticamente a `/admin` (sin pasos extra).
- De paso, guarda de qué negocio vino (cookie `admin_origin`, separada de
  la cookie de sesión) para que **Cerrar sesión** pueda volver a esa misma
  página pública en vez de a una ruta técnica.

Toda la lógica de autenticación (contraseña, cookie de sesión firmada,
protección de cada página) es la misma de siempre — este flujo solo
agrega una puerta de entrada más amigable, sin duplicarla.

### Subir imágenes desde la computadora

Logo, imagen de portada y galería de fotos se cargan con un selector de
archivo (JPG, PNG, WEBP, GIF o SVG, hasta 5 MB), sin necesidad de pegar
una URL a mano. Las imágenes se suben a Supabase Storage (bucket
`business-images`, creado por `schema.sql`) y quedan con URL pública
automáticamente.

### Apariencia

Cada negocio puede personalizar, sin tocar código:

- **Colores**: principal, secundario, fondo, texto.
- **Tipografía**: uno de 3 presets controlados (Clásica, Moderna, Elegante)
  — no hay libertad de elegir cualquier fuente, cada preset ya trae su
  combinación de fuentes pensada.
- **Estilo de botones**: Redondeado, Suave o Recto.

Se aplica al sitio público vía `AppearanceScope`, que setea variables CSS
y atributos `data-*` sin necesidad de CSS por negocio. Si un negocio no
tiene estos campos cargados (por ejemplo, uno creado antes de esta
funcionalidad), usa los valores por defecto de la plantilla.

### Locales y horarios

Desde la página del negocio, la sección **Locales y horarios** permite
crear uno o varios locales, cada uno con nombre, dirección, y un horario
semanal (día por día: abierto/cerrado y hora desde/hasta). Esto es lo que
el modal de reserva usa para calcular los horarios disponibles — sin al
menos un local con horario cargado, no hay ningún turno disponible para
reservar en el sitio público.

### Ver y gestionar turnos

Desde `/admin/negocios/[id]/turnos` (link "Ver turnos" en la página del
negocio) el dueño puede:

- Ver todos los turnos reservados, ordenados por fecha y hora, con el
  nombre del cliente, teléfono, servicio y local.
- Filtrar por un día puntual.
- Marcar un turno como **Confirmado** o **Cancelado**. Cancelar un turno
  libera ese horario automáticamente para nuevas reservas (la lógica de
  disponibilidad excluye las reservas canceladas).

## Cómo agregar un segundo negocio

Con Supabase y el panel de administración conectados, el flujo es:

1. Entrar a `/admin` → **Crear negocio**: nombre, slug, colores, contacto,
   dirección, imágenes.
2. Entrar al negocio recién creado → agregar sus servicios y precios.
3. La web queda disponible automáticamente en `/<slug>`.

Sin panel de administración (edición manual en Supabase), el flujo es
directamente por base de datos: insertar filas en `businesses` y `services`.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000/bella-vista` para ver el negocio demo.

## Comprobaciones

```bash
npx tsc --noEmit   # typecheck
npm run lint       # eslint
npm run build      # build de producción
```

## Fuera de alcance (a propósito)

Gestión de empleados, pagos online, inventario, fidelización, estadísticas
avanzadas, chat. No agregar sin pedido explícito.
