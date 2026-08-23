import { BookingStatus } from "@/types/business";
import {
  STATUS_COLOR,
  STATUS_SOLID,
} from "@/app/admin/negocios/[id]/(chrome)/turnos/booking-status";

interface StatusDotProps {
  status: BookingStatus;
  className?: string;
}

/**
 * Punto de estado de un turno, compartido por el resumen del día y las
 * cards de la Agenda.
 *
 * Dos razones para que exista en vez de un `<span>` con `backgroundColor`
 * inline como antes:
 * - 8px en vez de 6px: a 6px el color no era identificable, que es lo
 *   único que el punto tiene que hacer.
 * - `confirmed` y `completed` comparten color (ver STATUS_SOLID) — sin el
 *   relleno/contorno serían el mismo punto.
 */
export default function StatusDot({ status, className }: StatusDotProps) {
  const color = STATUS_COLOR[status];
  const solid = STATUS_SOLID[status];

  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 rounded-full shrink-0 ${className ?? ""}`}
      style={{
        backgroundColor: solid ? color : "transparent",
        boxShadow: solid ? undefined : `inset 0 0 0 1.5px ${color}`,
      }}
    />
  );
}
