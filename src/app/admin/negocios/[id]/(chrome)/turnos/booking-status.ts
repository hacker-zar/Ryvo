import { BookingStatus } from "@/types/business";

// Única fuente de verdad de labels/colores de estado — la usan tanto
// bookings-list.tsx (Lista) como los componentes de agenda/ (Agenda), así
// ambas vistas leen el mismo turno con la misma apariencia de estado sin
// duplicar el mapeo en dos lugares.

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

/**
 * Estado ≠ acción. El acento de marca (--brass) queda reservado para lo
 * que se puede tocar; un turno confirmado no es un botón. Por eso
 * `confirmed` usa el token semántico --ok y no el acento, como hacía
 * antes.
 *
 * Los tres tokens (--ok/--warn/--danger, ver globals.css) reemplazan a
 * los hexadecimales sueltos de Tailwind que había acá. `pending` sigue
 * siendo neutro a propósito: "todavía no pasó nada" no es un estado con
 * color propio, es la ausencia de uno.
 */
export const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "var(--bone-muted)",
  confirmed: "var(--ok)",
  completed: "var(--ok)",
  cancelled: "var(--danger)",
  no_show: "var(--warn)",
};

/**
 * `confirmed` y `completed` comparten color (los dos son "salió bien") —
 * lo que los distingue es el relleno: completado es sólido, confirmado
 * es solo contorno. Sin esto, en la Agenda serían indistinguibles.
 */
export const STATUS_SOLID: Record<BookingStatus, boolean> = {
  pending: false,
  confirmed: false,
  completed: true,
  cancelled: true,
  no_show: true,
};

/** Un turno "ya pasó" si su fecha es anterior a hoy, o es hoy pero su
 *  hora ya pasó — recién ahí tiene sentido ofrecer marcarlo Completado/
 *  No asistió (completar un turno futuro no tiene sentido). */
export function isPastBooking(
  booking: { date: string; time: string },
  today: string,
  nowTime: string
): boolean {
  if (booking.date < today) return true;
  if (booking.date > today) return false;
  return booking.time.slice(0, 5) < nowTime;
}
