import { BookingWithDetails } from "@/lib/data/business-repository";
import {
  STATUS_COLOR,
  STATUS_LABELS,
} from "../(chrome)/turnos/booking-status";

interface MyBookingsListProps {
  bookings: BookingWithDetails[];
}

/**
 * Lista de solo lectura de los turnos del profesional autenticado — todo
 * lo que puede ver una cuenta Barber (worker) en /rapido. Sin ninguna
 * acción (nada de cambiar estado, reprogramar ni cancelar): el filtrado
 * por `professional_id` ya se hizo en el server (ver getMyBookings en
 * actions.ts), acá solo se muestra.
 */
export default function MyBookingsList({ bookings }: MyBookingsListProps) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-bone-muted border-t border-ink-line pt-6">
        No tenés turnos asignados todavía.
      </p>
    );
  }

  return (
    <div className="divide-y divide-ink-line border-t border-b border-ink-line">
      {bookings.map((booking) => (
        <div key={booking.id} className="py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-bone font-medium">{booking.customer_name}</p>
            <p className="text-xs text-bone-muted mt-0.5">
              {booking.service_name} · {booking.date} {booking.time.slice(0, 5)}
            </p>
          </div>
          <span
            className="section-eyebrow text-[10px] px-2 py-1 radius-sm border shrink-0"
            style={{ color: STATUS_COLOR[booking.status], borderColor: STATUS_COLOR[booking.status] }}
          >
            {STATUS_LABELS[booking.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
