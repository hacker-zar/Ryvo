-- ============================================================
-- Hero personalizado + eje de densidad + tratamiento de imagen
-- ============================================================
-- PROPUESTA — todavía no aplicada. Revisar antes de ejecutar.
--
-- Las tres columnas son aditivas, con default que reproduce
-- EXACTAMENTE el comportamiento actual: ningún negocio existente
-- cambia de aspecto por correr esto. El cambio visual llega recién
-- cuando alguien elige otro valor desde el editor.
--
-- Seguro de re-ejecutar (add column if not exists + guardas en los
-- constraints), mismo criterio que el resto de supabase/schema.sql.

-- ------------------------------------------------------------
-- 1. Hero personalizado
-- ------------------------------------------------------------
-- Hoy TODOS los sitios de RYVO abren igual: eyebrow fija "Reservá tu
-- turno online" + <h1> con el nombre del negocio, que además ya está
-- en el header sticky 60px más arriba. La composición cambia por
-- plantilla; el contenido de apertura no. Es la razón principal por la
-- que dos sitios de RYVO se reconocen como hermanos.
--
-- Vacío = usar el texto de siempre (ver Hero.tsx). No se rellena con
-- el nombre del negocio acá a propósito: si lo hiciéramos, el día que
-- el dueño cambie el nombre del negocio el hero quedaría con el viejo.
alter table businesses add column if not exists hero_kicker text not null default '';
alter table businesses add column if not exists hero_headline text not null default '';

-- ------------------------------------------------------------
-- 2. Densidad
-- ------------------------------------------------------------
-- El espacio negativo es la variable que más define si una página se
-- lee como lujo o como catálogo. Hoy no es configurable: el ritmo
-- vertical está clavado en `py-16 md:py-24` en todas las secciones, y
-- lo único que varía es un condicional suelto en Footer.tsx.
--
-- '' = heredar el default de la plantilla (ver LAYOUT_BLUEPRINTS en
-- src/lib/templates/blueprints.ts). La densidad por plantilla vive en
-- código, no acá: es parte del carácter de la plantilla, igual que su
-- pareja tipográfica. Esta columna es solo la ANULACIÓN del dueño.
alter table businesses add column if not exists density text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_density_check'
  ) then
    alter table businesses add constraint businesses_density_check
      check (density in ('', 'compacta', 'estandar', 'amplia'));
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Tratamiento de imagen
-- ------------------------------------------------------------
-- Filtro aplicado a todas las fotos públicas vía `.image-frame`, que ya
-- centraliza el tratamiento de imagen (ver globals.css). Es como las
-- barberías construyen su identidad en Instagram — blanco y negro,
-- alto contraste, virado cálido — y hoy RYVO no lo ofrece.
--
-- 'natural' = sin filtro, exactamente lo de hoy.
alter table businesses add column if not exists image_treatment text not null default 'natural';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_image_treatment_check'
  ) then
    alter table businesses add constraint businesses_image_treatment_check
      check (image_treatment in ('natural', 'byn', 'contraste', 'calido'));
  end if;
end $$;

-- ------------------------------------------------------------
-- Verificación posterior (correr aparte, no destructivo)
-- ------------------------------------------------------------
-- select slug, hero_kicker, hero_headline, density, image_treatment
-- from businesses order by created_at;
