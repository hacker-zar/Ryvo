-- Schema base para la plantilla multi-negocio de peluquerías/barberías.
-- Ejecutar en el SQL editor de Supabase cuando el proyecto esté creado.

create extension if not exists "pgcrypto";

-- =========================
-- businesses
-- =========================
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  logo text default '',
  primary_color text default '#111111',
  secondary_color text default '#f5f5f5',
  whatsapp text default '',
  instagram text default '',
  address text default '',
  phone text default '',
  email text default '',
  city text default '',
  hero_image text default '',
  gallery text[] default '{}',
  opening_hours jsonb default '[]',
  background_color text default '#1a1815',
  text_color text default '#f7f4ee',
  typography_preset text not null default 'elegante'
    check (typography_preset in ('clasica', 'moderna', 'elegante')),
  button_style text not null default 'recto'
    check (button_style in ('redondeado', 'suave', 'recto')),
  -- Metadata descriptiva del onboarding (Peluquería/Barbería/Estilista
  -- independiente/Otro) — texto libre a propósito, sin CHECK, mismo
  -- criterio que city/address: no es algo que el resto del sistema
  -- necesite validar estrictamente.
  business_type text default '',
  -- En qué paso del onboarding quedó el negocio (0=recién creado, 5=todos
  -- los pasos recorridos) — permite retomar donde lo dejó. Default 5:
  -- cualquier negocio creado por el flujo actual del superadmin
  -- (adminCreateBusiness, sin tocar) queda "completo" sin pasar por
  -- ningún onboarding — solo el registro público inserta 0 explícito.
  onboarding_step smallint not null default 5,
  -- Si el negocio ya es visible en /[slug]. Default true por el mismo
  -- motivo: no romper negocios ya existentes ni el flujo del superadmin.
  -- Solo el registro público inserta false explícito.
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía de antes de agregar estas columnas, esto las suma
-- sin tocar los datos existentes. Seguro de re-ejecutar.
alter table businesses add column if not exists background_color text default '#1a1815';
alter table businesses add column if not exists text_color text default '#f7f4ee';
alter table businesses add column if not exists typography_preset text not null default 'elegante';
alter table businesses add column if not exists button_style text not null default 'recto';
alter table businesses add column if not exists business_type text default '';
alter table businesses add column if not exists onboarding_step smallint not null default 5;
alter table businesses add column if not exists published boolean not null default true;

-- DEPRECADA: contraseña única por negocio (hash scrypt "salt:hash" en hex).
-- Reemplazada por la tabla `accounts` (usuario + contraseña por cuenta) —
-- ver más abajo. Se conserva la columna sin usar, sin dropearla, porque la
-- migración a `accounts` fue no destructiva (se copió el hash existente a
-- la cuenta correspondiente en vez de perderlo). No leer ni escribir esta
-- columna desde código nuevo.
alter table businesses add column if not exists admin_password_hash text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_typography_preset_check'
  ) then
    alter table businesses add constraint businesses_typography_preset_check
      check (typography_preset in ('clasica', 'moderna', 'elegante'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_button_style_check'
  ) then
    alter table businesses add constraint businesses_button_style_check
      check (button_style in ('redondeado', 'suave', 'recto'));
  end if;
end $$;

-- =========================
-- accounts (login del dueño/staff de un negocio — usuario + contraseña)
-- Reemplaza la contraseña única por negocio (businesses.admin_password_hash,
-- deprecada arriba). Hoy la relación es 1 cuenta → 1 negocio, pero
-- `business_id` NO tiene constraint de unicidad a propósito: el diseño ya
-- soporta que más adelante un negocio tenga varias cuentas (roles/permisos
-- distintos), sin cambiar el esquema, solo agregando filas.
-- =========================
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  username text not null,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists accounts_business_id_idx on accounts(business_id);
-- Username único sin distinguir mayúsculas/minúsculas (se normaliza a
-- minúsculas en el server antes de comparar/guardar).
create unique index if not exists accounts_username_idx on accounts (lower(username));

-- =========================
-- services
-- =========================
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text default '',
  -- Ambos opcionales: un servicio puede publicarse sin precio y/o sin
  -- duración todavía definidos (ej. "a consultar") — ver Service en
  -- types/business.ts y el chequeo explícito en createBooking (nunca se
  -- inventa una duración para reservar un servicio que no la tiene).
  price numeric(10,2) default 0,
  duration integer default 30, -- minutos
  active boolean not null default true
);

create index if not exists services_business_id_idx on services(business_id);

-- =========================
-- locations (sucursales/locales de un negocio)
-- Estructura mínima para soportar negocios con uno o varios locales.
-- Si el negocio tiene un único local, alcanza con una sola fila acá.
-- =========================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  address text default '',
  opening_hours jsonb default '[]',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists locations_business_id_idx on locations(business_id);

-- =========================
-- bookings
-- =========================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  date date not null,
  time time not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_business_id_idx on bookings(business_id);
create index if not exists bookings_date_idx on bookings(business_id, date);

-- Evita reservas duplicadas para el mismo negocio/local/fecha/hora,
-- siempre que la reserva no esté cancelada. Esto es la defensa a nivel DB;
-- la app también valida disponibilidad antes de insertar.
create unique index if not exists bookings_no_duplicate_slot
  on bookings (business_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid), date, time)
  where status <> 'cancelled';

-- =========================
-- professionals (equipo del negocio, mostrado como señal de confianza en
-- la web pública — no está ligado al flujo de reservas a propósito, es
-- solo presentación: elegir profesional no es parte del wizard).
-- =========================
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  role text default '',
  bio text default '',
  photo text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists professionals_business_id_idx on professionals(business_id);

-- =========================
-- reviews
-- =========================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_business_id_idx on reviews(business_id);

-- =========================
-- Row Level Security
-- =========================
alter table businesses enable row level security;
alter table locations enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table professionals enable row level security;
-- accounts: RLS habilitada A PROPÓSITO sin ninguna política — ni lectura ni
-- escritura pública. Solo accesible vía supabaseAdmin (service role, salta
-- RLS) desde el server de login/gestión de cuentas. Nunca debe haber una
-- política "public read accounts": expondría username/password_hash.
alter table accounts enable row level security;

-- Lectura pública (la web es pública, cualquiera puede ver negocios/servicios/reseñas/equipo).
create policy "public read businesses" on businesses for select using (true);
create policy "public read locations" on locations for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public read professionals" on professionals for select using (true);

-- Reservas: cualquiera puede crear (formulario público de reserva) y leer
-- (necesario para calcular disponibilidad de horarios en el cliente/servidor
-- sin exponer datos sensibles: solo se filtra por business/location/date/hora,
-- no se muestran nombres/teléfonos de otros clientes en la UI pública).
create policy "public insert bookings" on bookings for insert with check (true);
create policy "public read bookings for availability" on bookings for select using (true);

-- Reseñas: cualquiera puede dejar una reseña.
create policy "public insert reviews" on reviews for insert with check (true);

-- NOTA: administración (crear negocios, servicios, gestionar bookings) se
-- hace con la service_role key desde server actions (src/lib/admin/*),
-- nunca desde el cliente. La autorización por negocio (que el dueño de un
-- negocio no pueda tocar otro) vive en la capa de sesión/aplicación
-- (src/lib/admin/session.ts, authorize.ts), no en RLS — RLS acá solo cubre
-- lectura pública e inserts públicos de bookings/reviews.

-- =========================
-- Storage: imágenes de negocios (logo, portada, galería)
-- =========================
-- El bucket se crea desde el Dashboard de Supabase (Storage → New bucket)
-- con el nombre "business-images", marcado como público, o ejecutando:
insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

-- Lectura pública (las imágenes se muestran en el sitio, sin login).
create policy "public read business images"
  on storage.objects for select
  using (bucket_id = 'business-images');

-- La subida/edición/borrado de archivos se hace únicamente desde el panel
-- de administración, usando la service_role key (que se salta estas
-- políticas), igual que el resto de las escrituras de /admin.

-- === Editor: video en bucle, un solo especialista, orden de secciones,
-- animaciones. Aplicado directo contra Supabase vía apply_migration —
-- este bloque es documentación posterior, no la fuente de verdad (varias
-- columnas/tablas de fases anteriores, como display_order/experience en
-- professionals o la tabla clients, ya están en producción sin haber
-- vuelto a este archivo). ===
alter table businesses add column if not exists hero_video text not null default '';
alter table businesses add column if not exists hero_video_enabled boolean not null default false;
alter table businesses add column if not exists hero_video_position text not null default 'center'
  check (hero_video_position in ('center','top','bottom'));

alter table businesses add column if not exists single_specialist_mode boolean not null default false;

-- Hero no está en la lista: queda siempre fijo primero, fuera del orden
-- configurable (ver SectionId en types/business.ts).
alter table businesses add column if not exists section_order jsonb not null default
  '[{"id":"services","enabled":true},{"id":"professionals","enabled":true},{"id":"gallery","enabled":true},{"id":"about","enabled":true},{"id":"reviews","enabled":true},{"id":"contact","enabled":true}]'::jsonb;

alter table businesses add column if not exists animation_preset text not null default 'sutil'
  check (animation_preset in ('ninguna','sutil','dinamica'));

-- === Eliminar solapamientos de reservas por duración real (aplicado
-- directo contra Supabase vía apply_migration; documentación posterior,
-- no fuente de verdad). Reemplaza bookings_no_duplicate_slot de arriba
-- (que en producción real SÍ incluye professional_id, a diferencia de
-- lo que muestra la definición de arriba en este archivo — quedó
-- desactualizada en una fase anterior) por un constraint de exclusión
-- que compara el INTERVALO real [inicio, fin) en vez de la hora exacta,
-- atómico a nivel de base de datos (sin condición de carrera posible
-- entre dos inserts concurrentes). ===
alter table bookings add column if not exists duration_min integer;

update bookings b
set duration_min = coalesce(
  (select s.duration from services s where s.id = b.service_id), 30
)
where duration_min is null;

alter table bookings alter column duration_min set default 30;
alter table bookings alter column duration_min set not null;

-- Requerido para combinar columnas de igualdad (uuid/date) con un rango
-- de enteros en el mismo índice GiST.
create extension if not exists btree_gist;

alter table bookings add constraint bookings_no_overlap
  exclude using gist (
    business_id with =,
    coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    date with =,
    int4range(
      (extract(epoch from time) / 60)::int,
      (extract(epoch from time) / 60)::int + duration_min
    ) with &&
  ) where (status <> 'cancelled');

-- Subsumido íntegramente por el constraint de arriba.
drop index if exists bookings_no_duplicate_slot;

-- === Sistema de plantillas (aplicado directo contra Supabase vía
-- apply_migration; documentación posterior, no fuente de verdad — las 5
-- filas oficiales sembradas en `templates` ya están en producción y no
-- se repiten acá, ver Template/TemplateLayoutId en types/business.ts y
-- src/lib/palette-presets.ts / src/lib/templates/blueprints.ts). ===
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  slug text unique,
  name text not null,
  description text not null default '',
  is_official boolean not null default false,
  layout text not null check (layout in ('atelier','noir','studio','editorial','bold')),
  palette_id text not null,
  button_style text not null default 'recto' check (button_style in ('redondeado','suave','recto')),
  animation_preset text not null default 'sutil' check (animation_preset in ('ninguna','sutil','dinamica')),
  section_order jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists templates_business_id_idx on templates(business_id);
alter table templates enable row level security;
create policy "public read official templates" on templates for select using (is_official = true);

alter table businesses add column if not exists template_id uuid references templates(id) on delete set null;
alter table businesses add column if not exists template_layout text;
alter table businesses add column if not exists palette_id text;

-- === Catálogo de productos (aplicado directo contra Supabase vía
-- apply_migration; documentación posterior, no fuente de verdad). Capa
-- de contenido mínima — foto + nombre + precio + descripción opcional,
-- sin stock/variantes/carrito todavía (ver Product en
-- types/business.ts). Se integra con el sistema de secciones ya
-- existente (SectionId incluye "products") en vez de un mecanismo de
-- activación propio. ===
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_business_id_idx on products(business_id);
alter table products enable row level security;
create policy "public read products" on products for select using (true);

-- === Estilo de galería pública (aplicado directo contra Supabase vía
-- apply_migration; documentación posterior, no fuente de verdad). Cómo
-- se presenta el MISMO array `gallery` — no agrega ninguna copia de
-- imágenes (ver GalleryLayoutId en types/business.ts y
-- components/gallery/*). Default 'editorial' backfillea also los
-- negocios existentes (ADD COLUMN ... NOT NULL DEFAULT completa las
-- filas ya existentes con ese valor), así ningún negocio queda sin
-- valor válido. ===
alter table businesses add column if not exists gallery_layout text not null default 'editorial'
  check (gallery_layout in ('editorial','movimiento','filmstrip','masonry','showcase'));

-- === Estilo visual de fotos públicas (aplicado directo contra Supabase
-- vía apply_migration; documentación posterior, no fuente de verdad).
-- Mismo mecanismo de preset cerrado que typography_preset/button_style
-- (ver ImageRadiusPreset/ImageShadowPreset en types/business.ts,
-- AppearanceScope.tsx y la clase .image-frame en globals.css). Defaults
-- 'recto'/'ninguna' — backfillean también los negocios existentes con el
-- aspecto exacto de siempre (sin radio, sin sombra). ===
alter table businesses add column if not exists image_radius text not null default 'recto'
  check (image_radius in ('recto','suave','redondeado','muy-redondeado'));
alter table businesses add column if not exists image_shadow text not null default 'ninguna'
  check (image_shadow in ('ninguna','suave','media','marcada'));

-- === Notification Engine (aplicado directo contra Supabase vía
-- apply_migration; documentación posterior, no fuente de verdad).
-- Los toggles viven en `businesses` (mismo patrón que gallery_layout/
-- image_radius: default apagado = cero cambio de comportamiento para
-- negocios existentes) — no una tabla de "settings" aparte, para
-- reutilizar 1:1 BUSINESS_PUBLIC_COLUMNS/adminUpdateBusiness en vez de
-- inventar un segundo mecanismo de fetch+guardado.
--
-- `notification_events` es el outbox: cada Server Action que ya muta
-- `bookings` (createBooking/updateBookingStatus/cancelBookingById/
-- rescheduleBookingById) inserta una fila acá en vez de llamar al
-- proveedor de WhatsApp directo — así un fallo de red al enviar nunca
-- puede romper la reserva real (mismo criterio que
-- upsertClientForBooking, que tampoco puede bloquear la reserva si
-- falla). `payload` es un snapshot inmutable (nombre/fecha/hora/
-- servicio) para que el mensaje no dependa de que el booking siga
-- igual después. Sin tabla de plantillas separada a propósito: los
-- textos son presets fijos de RYVO (ver lib/notifications/messages.ts),
-- mismo criterio de "presets controlados, no texto libre" que
-- gallery_layout/image_radius. Un solo canal (whatsapp) en esta primera
-- entrega — el `channel` queda como columna desde ahora para no tener
-- que migrar de nuevo el día que se agregue email. ===
alter table businesses add column if not exists notify_whatsapp_enabled boolean not null default false;
alter table businesses add column if not exists notify_reminder_24h_enabled boolean not null default false;

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  type text not null check (type in (
    'booking_created','booking_confirmed','booking_cancelled',
    'booking_rescheduled','reminder_24h'
  )),
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  recipient text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  scheduled_for timestamptz not null default now(),
  payload jsonb not null default '{}',
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notification_events_due_idx on notification_events (status, scheduled_for);
create index if not exists notification_events_booking_idx on notification_events (booking_id);
create index if not exists notification_events_business_idx on notification_events (business_id);

alter table notification_events enable row level security;
-- Sin políticas públicas a propósito (mismo criterio que accounts/clients):
-- solo supabaseAdmin, desde Server Actions/el endpoint de cron ya
-- protegidos, puede leer/escribir esta tabla.

-- === Animaciones de entrada: 2 presets nuevos (aplicado directo contra
-- Supabase vía apply_migration; documentación posterior, no fuente de
-- verdad). Reveal.tsx/useScrollReveal.ts no cambian — ver AnimationPreset
-- en types/business.ts y los bloques [data-animation="revelado"/
-- "escalonada"] en globals.css. Solo ensancha los 2 CHECK constraints ya
-- existentes, ningún dato ni default cambia para negocios existentes. ===
alter table businesses drop constraint businesses_animation_preset_check;
alter table businesses add constraint businesses_animation_preset_check
  check (animation_preset in ('ninguna','sutil','dinamica','revelado','escalonada'));

alter table templates drop constraint templates_animation_preset_check;
alter table templates add constraint templates_animation_preset_check
  check (animation_preset in ('ninguna','sutil','dinamica','revelado','escalonada'));

-- === RBAC: rol "partner" (multi-negocio), aplicado directo contra Supabase
-- vía apply_migration; documentación posterior, no fuente de verdad. No
-- destructivo: las cuentas existentes (role business-scoped, business_id no
-- nulo) siguen pasando el nuevo constraint tal cual. Ver AccountRole en
-- types/business.ts, session.ts (AdminSession variante "partner") y
-- authorize.ts. ===
alter table accounts alter column business_id drop not null;

alter table accounts drop constraint accounts_role_check;
alter table accounts add constraint accounts_role_check
  check (role in ('owner','admin','worker','partner'));

-- Una fila es business-scoped XOR partner-scoped, nunca las dos cosas.
alter table accounts add constraint accounts_partner_business_shape
  check ((role = 'partner') = (business_id is null));

-- Atajo de lectura en businesses (evita joinear partner_businesses en cada
-- listado) — cada negocio tiene a lo sumo 1 partner asignado.
alter table businesses add column if not exists partner_id uuid
  references accounts(id) on delete set null;
create index if not exists businesses_partner_id_idx on businesses(partner_id);

-- Tabla de unión (mismo patrón que professional_services) — soporta multi-
-- partner-por-negocio a futuro sin volver a tocar el esquema, aunque hoy en
-- la práctica queda en sync 1:1 con businesses.partner_id.
create table if not exists partner_businesses (
  partner_account_id uuid not null references accounts(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (partner_account_id, business_id)
);
create index if not exists partner_businesses_business_idx on partner_businesses(business_id);

alter table partner_businesses enable row level security;
-- Sin políticas públicas a propósito, mismo criterio que `accounts`: solo
-- supabaseAdmin (service role) puede leer/escribir esta tabla.

-- === RBAC: se retira 'admin' del rol dentro de un negocio. Era
-- scaffolding previo a este sistema de roles, sin UI para crearlo y sin
-- ninguna diferencia de comportamiento respecto a 'owner' — confirmado
-- 0 filas con role='admin' antes de este cambio. El pedido de RBAC de
-- RYVO fue explícito en que el rol administrativo/comercial es Partner,
-- no un "admin" separado. Ver AccountRole en types/business.ts. ===
alter table accounts drop constraint accounts_role_check;
alter table accounts add constraint accounts_role_check
  check (role in ('owner','worker','partner'));

-- === Academia: funcionalidad nativa reutilizable de RYVO (aplicado
-- directo contra Supabase vía apply_migration; documentación posterior,
-- no fuente de verdad). NO específica de ningún negocio — Barbers Rosario
-- es solo el primer cliente que la usa, cero lógica atada a su id/slug
-- en ningún lado. Ver SectionId en types/business.ts (nuevo valor
-- "academy") y Academy.tsx.
--
-- `academies` es 1:1 por negocio (como templates/accounts) — no
-- embebida en `businesses` porque son ~9 campos propios de un módulo
-- opcional, no atributos generales del negocio. `academy_categories`
-- reutiliza Sedes/Profesionales vía FK simple (location_id/instructor_id,
-- on delete set null) en vez de duplicar esos datos. `academy_interests`
-- reutiliza el patrón "insert público, sin ninguna política de lectura"
-- ya usado por `accounts`/`notification_events`: nadie externo puede
-- consultar solicitudes ajenas, ni siquiera las propias. ===
create table if not exists academies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  enabled boolean not null default true,
  name text not null default '',
  headline text not null default '',
  description text not null default '',
  image text not null default '',
  logo text not null default '',
  cta_text text not null default 'Quiero inscribirme',
  contact_phone text not null default '',
  activity_type text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists academy_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  age_level text not null default '',
  description text not null default '',
  -- Mismos códigos que OpeningHours.day (lun/mar/.../dom) — reutiliza
  -- dayLabel() de format.ts tal cual para mostrarlo.
  days text[] not null default '{}',
  -- Texto libre ("18:00 hs") a propósito: Academia no tiene motor de
  -- turnos real (sin detección de choques ni slots) — es una solicitud
  -- de interés, no una reserva de horario.
  schedule_time text not null default '',
  location_id uuid references locations(id) on delete set null,
  instructor_id uuid references professionals(id) on delete set null,
  capacity integer check (capacity is null or capacity >= 0),
  image text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academy_categories_business_id_idx on academy_categories(business_id);

create table if not exists academy_interests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  -- Nullable + on delete set null (no cascade): si la categoría se borra
  -- de verdad, el lead histórico se conserva (se muestra "Categoría
  -- eliminada" en el admin, mismo fallback que ya usa
  -- listBookingsByBusiness para service_name).
  academy_category_id uuid references academy_categories(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  status text not null default 'new' check (status in ('new','contacted','enrolled','discarded')),
  created_at timestamptz not null default now()
);
create index if not exists academy_interests_business_id_idx on academy_interests(business_id);
create index if not exists academy_interests_status_idx on academy_interests(business_id, status);

alter table academies enable row level security;
alter table academy_categories enable row level security;
alter table academy_interests enable row level security;

create policy "public read academies" on academies for select using (true);
create policy "public read academy categories" on academy_categories for select using (true);
create policy "public insert academy interests" on academy_interests for insert with check (true);

-- === Login con Google: Owner/Worker (vinculación manual, nunca
-- autoprovisión) y Customer (autoprovisión). Partner y Superadmin quedan
-- FUERA de esta fase, sin cambios. Aplicado directo contra Supabase vía
-- apply_migration; documentación posterior, no fuente de verdad.
--
-- accounts.google_sub: NO es el claim "sub" crudo del JWT de Google — es
-- `auth.users.id` de Supabase Auth para la identidad de Google ya
-- verificada (estable por cuenta de Google dentro de este proyecto de
-- Supabase, ver verifyGoogleAccessToken en src/lib/google-identity.ts).
-- Vincular Google a una cuenta existente es autoservicio: la persona
-- entra primero con usuario+contraseña como siempre y, ya autenticada,
-- vincula su Google desde su propia cuenta — nunca al revés. Un Google
-- sin vínculo previo nunca crea ni promueve una cuenta admin. ===
alter table accounts add column if not exists google_sub text;
alter table accounts add column if not exists google_email text;

-- Ambas columnas se llenan o quedan vacías juntas — nunca una sí y la otra no.
alter table accounts add constraint accounts_google_link_shape
  check ((google_sub is null) = (google_email is null));

-- Único: la misma cuenta de Google no puede terminar vinculada a dos filas
-- de `accounts`. Parcial porque la mayoría de las cuentas no tiene Google
-- vinculado.
create unique index if not exists accounts_google_sub_idx
  on accounts (google_sub) where google_sub is not null;

-- =========================
-- customers (identidad de cliente final autenticada con Google — separada
-- de `accounts` a propósito: sin business_id, sin rol RBAC, nunca pasa por
-- canManageBusiness/requireAdminFor. También separada de la tabla
-- `clients` derivada de reservas de invitado (ver "Clientes" en el admin):
-- esa es un contacto por negocio armado a partir de bookings; esta es una
-- identidad real logueada, única para toda la plataforma. Esta fase
-- entrega solo identidad + sesión propia (`customer_session`) — conectar
-- bookings.customer_id y agregar UI pública queda para un pedido futuro.)
-- =========================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  google_sub text not null,
  email text not null,
  name text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists customers_google_sub_idx on customers (google_sub);

alter table customers enable row level security;
-- Sin políticas públicas a propósito, mismo criterio que `accounts`: solo
-- supabaseAdmin (service role) puede leer/escribir esta tabla.

-- === Solicitudes de página nueva ("Quiero mi página" en la home
-- pública) — mismo patrón que academy_interests: RLS habilitada, SOLO
-- política de insert público, cero política de lectura. A diferencia de
-- /registro (alta real, crea cuenta+negocio al instante), esto es
-- apenas un lead: no crea nada más, RYVO revisa y contacta manualmente
-- (ver /admin/solicitudes). ===
create table if not exists page_requests (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  business_name text not null,
  whatsapp text not null,
  instagram text not null default '',
  business_type text not null default '',
  what_you_want text not null default '',
  comments text not null default '',
  status text not null default 'new' check (status in ('new','contacted','converted','discarded')),
  created_at timestamptz not null default now()
);
create index if not exists page_requests_status_idx on page_requests(status);

alter table page_requests enable row level security;
create policy "public insert page requests" on page_requests for insert with check (true);

-- Conversión solicitud → negocio ("Convertir en negocio" en
-- /admin/solicitudes). Nullable: una solicitud nueva todavía no tiene
-- negocio. `on delete set null` (no cascade) — mismo criterio que
-- academy_interests.academy_category_id: si el negocio se borra de
-- verdad, la solicitud (y su historial) se conserva.
alter table page_requests add column if not exists business_id uuid references businesses(id) on delete set null;
create index if not exists page_requests_business_id_idx on page_requests(business_id);
