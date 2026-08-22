import { BookingWithDetails } from "@/lib/data/business-repository";
import { formatPrice } from "@/lib/format";
import { STATUS_COLOR, STATUS_LABELS } from "../booking-status";
import { BookingStatus } from "@/types/business";

interface DaySummaryProps {
  bookings: BookingWithDetails[];
}

const COUNTED_STATUSES: BookingStatus[] = [
  "confirmed",
  "pending",
  "completed",
  "cancelled",
  "no_show",
];

/**
 * Resumen "¿cómo está mi día?" — cuenta por estado sobre los mismos
 * `bookings` que ya cargó la página (cero query extra). La facturación
 * estimada solo se calcula y se muestra cuando TODOS los turnos
 * facturables (confirmados/completados) tienen un precio real cargado —
 * si alguno tiene `service_price: null`, se omite la cifra en vez de
 * tratarlo como $0 (ver Service.price / listBookingsByBusiness).
 */
export default function DaySummary({ bookings }: DaySummaryProps) {
  const total = bookings.length;

  if (total === 0) {
    return (
      <p className="text-sm text-bone-muted">No hay turnos para mostrar.</p>
    );
  }

  const counts = COUNTED_STATUSES.map((status) => ({
    status,
    count: bookings.filter((b) => b.status === status).length,
  })).filter((c) => c.count > 0);

  const billable = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
  const hasIncompletePricing = billable.some((b) => b.service_price == null);
  const estimatedRevenue = billable.reduce(
    (sum, b) => sum + (b.service_price ?? 0),
    0
  );

  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
      <span className="ticket-number text-2xl text-bone">
        {total} <span className="text-xs text-bone-muted">{total === 1 ? "turno" : "turnos"}</span>
      </span>

      {counts.map(({ status, count }) => (
        <span key={status} className="flex items-center gap-1.5 text-xs text-bone-muted">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_COLOR[status] }}
          />
          {count} {STATUS_LABELS[status]}
        </span>
      ))}

      {billable.length > 0 && !hasIncompletePricing ? (
        <span className="text-xs text-bone-muted">
          Facturación estimada:{" "}
          <span className="text-bone font-medium">{formatPrice(estimatedRevenue)}</span>
        </span>
      ) : null}
    </div>
  );
}
