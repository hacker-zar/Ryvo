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

export const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "var(--bone-muted)",
  confirmed: "var(--brass)",
  completed: "#4ade80",
  cancelled: "#f87171",
  no_show: "#fb923c",
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
