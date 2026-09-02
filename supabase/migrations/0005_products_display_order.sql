-- ============================================================
-- products.display_order — orden manual del catálogo
-- ============================================================
-- Mismo mecanismo que professionals.display_order (ver
-- reorderProfessional en business-repository.ts): un entero por
-- producto, intercambiado con el vecino al subir/bajar, sin
-- drag-and-drop.
--
-- BACKFILL: agregar la columna con default 0 dejaría TODAS las filas
-- existentes empatadas en 0 — el ORDER BY display_order, created_at que
-- se agrega después de este archivo resolvería ese empate por
-- created_at igual, así que en los hechos no se "pierde" el orden
-- visible hoy... pero display_order pasaría a ser una mentira (todos en
-- 0) desde el primer momento, y el primer "Subir"/"Bajar" que alguien
-- haga partiría de una base sin sentido. Se numera 0,1,2... por
-- business_id en el mismo orden que ya tenían por created_at, para que
-- el valor inicial de la columna sea real desde el día uno.

alter table products add column if not exists display_order integer not null default 0;

with ordered as (
  select id, row_number() over (partition by business_id order by created_at asc) - 1 as new_order
  from products
)
update products
set display_order = ordered.new_order
from ordered
where products.id = ordered.id;

create index if not exists products_business_id_display_order_idx
  on products(business_id, display_order);

-- ------------------------------------------------------------
-- Verificación posterior
-- ------------------------------------------------------------
-- select business_id, name, display_order, created_at
-- from products order by business_id, display_order;
-- → por cada business_id, display_order arranca en 0 y sube de a 1,
--   en el mismo orden que created_at tenía antes de esta migración.

-- ------------------------------------------------------------
-- ROLLBACK
-- ------------------------------------------------------------
-- drop index if exists products_business_id_display_order_idx;
-- alter table products drop column if exists display_order;
