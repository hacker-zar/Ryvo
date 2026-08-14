# Plantilla multi-negocio para peluquerías y barberías

Sitio único y reutilizable (Next.js + Tailwind + Supabase) para servir la
web de múltiples peluquerías/barberías, cada una identificada por su
`business_id` / `slug`, cambiando solo datos, no código.

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
   `businesses`, `services`, `bookings`, `reviews` con RLS básica).
3. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL`
   y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Cargar un negocio (fila en `businesses`) con sus servicios.

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
2. Entrar a `/admin/login`.
3. Requiere Supabase conectado para poder crear/editar — en modo demo el
   panel se ve pero avisa que hace falta configurar la base de datos.

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
