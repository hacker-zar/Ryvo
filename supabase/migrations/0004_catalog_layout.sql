-- ============================================================
-- businesses.catalog_layout
-- ============================================================
-- Estilo de presentación del catálogo público, elegido por el negocio —
-- mismo mecanismo que gallery_layout (ver Gallery.tsx/GalleryLayoutId):
-- una sola columna en `businesses`, independiente de `template_layout`.
-- A diferencia de gallery_layout, el catálogo pasa a depender SOLO de
-- esta columna para su composición (ver Products.tsx tras la Etapa 2) —
-- template_layout deja de decidir qué se renderiza en el catálogo, solo
-- sigue aportando apariencia (tipografía/densidad) a través del sistema
-- ya existente.
--
-- `destacados` ya es un valor válido desde esta migración aunque su
-- renderer (CatalogFeatured) recién se agrega en la Etapa 3 — el
-- dispatcher de la Etapa 2 lo hace caer a Lista mientras tanto (fallback
-- explícito, no un error).

alter table businesses add column if not exists catalog_layout text not null default 'lista';

alter table businesses drop constraint if exists businesses_catalog_layout_check;
alter table businesses add constraint businesses_catalog_layout_check
  check (catalog_layout in ('lista', 'grilla', 'destacados'));

-- ------------------------------------------------------------
-- Verificación posterior
-- ------------------------------------------------------------
-- select column_name, column_default, is_nullable
-- from information_schema.columns
-- where table_name = 'businesses' and column_name = 'catalog_layout';
-- → column_default = 'lista'::text, is_nullable = 'NO'
--
-- select catalog_layout, count(*) from businesses group by catalog_layout;
-- → todos los negocios existentes deben quedar en 'lista'

-- ------------------------------------------------------------
-- ROLLBACK
-- ------------------------------------------------------------
-- alter table businesses drop constraint if exists businesses_catalog_layout_check;
-- alter table businesses drop column if exists catalog_layout;
