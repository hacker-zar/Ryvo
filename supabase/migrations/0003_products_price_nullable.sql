-- ============================================================
-- products.price → nullable, sin default
-- ============================================================
-- Precio opcional: un negocio puede cargar un producto sin precio
-- todavía ("Consultar precio", ver formatPrice en lib/format.ts, que ya
-- contemplaba `null` desde antes de esta migración — solo faltaba que la
-- columna y el tipo lo permitieran). No se toca ningún otro campo ni se
-- reescribe ninguna fila existente: los precios ya cargados quedan
-- exactamente iguales, esto solo relaja la restricción para las
-- escrituras nuevas.

alter table products alter column price drop not null;
alter table products alter column price drop default;

-- ------------------------------------------------------------
-- Verificación posterior
-- ------------------------------------------------------------
-- select is_nullable, column_default
-- from information_schema.columns
-- where table_name = 'products' and column_name = 'price';
-- → is_nullable = 'YES', column_default = null
--
-- select count(*) from products where price is null; → 0 (nadie pierde
-- su precio con esta migración, ningún UPDATE se ejecuta acá)

-- ------------------------------------------------------------
-- ROLLBACK
-- ------------------------------------------------------------
-- update products set price = 0 where price is null;
-- alter table products alter column price set default 0;
-- alter table products alter column price set not null;
