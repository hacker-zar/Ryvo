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
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía de antes de agregar estas columnas de apariencia,
-- esto las suma sin tocar los datos existentes. Seguro de re-ejecutar.
alter table businesses add column if not exists background_color text default '#1a1815';
alter table businesses add column if not exists text_color text default '#f7f4ee';
alter table businesses add column if not exists typography_preset text not null default 'elegante';
alter table businesses add column if not exists button_style text not null default 'recto';

-- Aislamiento multi-tenant: contraseña propia de ESTE negocio (hash scrypt
-- "salt:hash" en hex, generado en src/lib/admin/session.ts — nunca texto
-- plano). NULL = sin contraseña propia todavía, solo el superadmin
-- (ADMIN_PASSWORD) puede gestionarlo. Nunca debe seleccionarse en una
-- query cuyo resultado pueda llegar a un Client Component ni al sitio
-- público — ver BUSINESS_PUBLIC_COLUMNS en business-repository.ts.
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
-- services
-- =========================
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  duration integer not null default 30, -- minutos
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
