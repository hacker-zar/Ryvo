-- ============================================================
-- ROLLBACK de 0001_hero_densidad_tratamiento.sql
-- ============================================================
-- Solo ejecutar si hay que revertir. Devuelve `businesses` a su forma
-- exacta anterior a la migración.
--
-- Por qué es seguro: las tres columnas NO existían antes (verificado:
-- information_schema devolvía 0 de 4 al momento de migrar), así que
-- ninguna columna preexistente se toca, ni se lee, ni se reescribe.
-- Dropear una columna que la migración creó no puede perder datos
-- previos — no había nada ahí.
--
-- Lo ÚNICO que se pierde son los valores que los dueños hayan cargado
-- DESPUÉS de migrar (un titular de hero escrito a mano, una densidad
-- elegida). Si ya se está usando el editor, exportar antes:
--
--   select id, slug, hero_kicker, hero_headline, density, image_treatment
--   from businesses order by created_at;
--
-- Los constraints se dropean ANTES que las columnas por claridad; en
-- Postgres el `drop column` se los llevaría igual en cascada.

alter table businesses drop constraint if exists businesses_density_check;
alter table businesses drop constraint if exists businesses_image_treatment_check;

alter table businesses drop column if exists hero_kicker;
alter table businesses drop column if exists hero_headline;
alter table businesses drop column if exists density;
alter table businesses drop column if exists image_treatment;

-- Verificación posterior: debe devolver 0.
-- select count(*) from information_schema.columns
--  where table_schema='public' and table_name='businesses'
--    and column_name in ('hero_kicker','hero_headline','density','image_treatment');
