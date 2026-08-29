-- ============================================================
-- bookings.service_id: ON DELETE CASCADE → NO ACTION
-- ============================================================
-- PROPUESTA — todavía no aplicada. Revisar antes de ejecutar.
--
-- Hoy borrar un servicio arrastra en silencio TODOS sus turnos:
-- historial completado y reservas futuras confirmadas por igual.
-- Irrecuperable, y detrás de un solo confirm().
--
-- Que es un descuido y no una decisión se ve en el contraste con las
-- otras tres FK de la misma tabla, que sí se pensaron para NO perder el
-- turno cuando desaparece lo que referencian:
--
--   professional_id → SET NULL
--   location_id     → SET NULL
--   client_id       → SET NULL
--   service_id      → CASCADE   ← la excepción
--
-- `service_id` es NOT NULL, así que SET NULL no es una opción sin
-- volverlo nullable (rompería BookingWithDetails, stats y la Agenda).
-- La alternativa correcta es impedir el borrado.
--
-- POR QUÉ `NO ACTION` Y NO `RESTRICT`
-- Los dos impiden borrar un servicio con turnos, pero se chequean en
-- momentos distintos: RESTRICT verifica de inmediato, NO ACTION al
-- final de la sentencia. Eso importa si alguna vez se borra un negocio:
-- `businesses` cascadea a `bookings` Y a `services` a la vez, y con
-- RESTRICT el borrado de services podría evaluarse antes de que se
-- hayan ido sus bookings, abortando la operación entera. Con NO ACTION
-- el chequeo corre al final, cuando ya no quedan huérfanos, y el borrado
-- del negocio funciona.
--
-- (Hoy la app no borra negocios desde ningún lado — verificado — pero
-- esto deja la puerta abierta sin una trampa escondida adentro.)
--
-- El código ya no depende de esto: deleteService() en
-- business-repository.ts cuenta los turnos y se niega antes de llegar a
-- la base, ofreciendo `active: false` como alternativa. Esta migración
-- es la red de seguridad para cualquier escritura futura que no pase
-- por esa función.

alter table bookings
  drop constraint if exists bookings_service_id_fkey;

alter table bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references services(id)
  on delete no action;

-- ------------------------------------------------------------
-- Verificación posterior — debe devolver 'NO ACTION'
-- ------------------------------------------------------------
-- select rc.delete_rule
-- from information_schema.referential_constraints rc
-- where rc.constraint_name = 'bookings_service_id_fkey';

-- ------------------------------------------------------------
-- ROLLBACK (vuelve al comportamiento destructivo anterior)
-- ------------------------------------------------------------
-- alter table bookings drop constraint if exists bookings_service_id_fkey;
-- alter table bookings add constraint bookings_service_id_fkey
--   foreign key (service_id) references services(id) on delete cascade;
