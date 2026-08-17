import Link from "next/link";
import { BookingWithDetails } from "@/lib/data/business-repository";

interface TodaySummaryProps {
  businessId: string;
  bookings: BookingWithDetails[];
  nowTime: string;
}

// Un turno cancelado no cuenta como "algo que hacer hoy" — mismo criterio
// que ya usa la disponibilidad de reservas (todo lo que no sea 'cancelled'
// ocupa el slot).
const ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

/**
 * Resumen de turnos de hoy — lo primero que ve el dueño al entrar a su
 * negocio, para que "¿qué tengo hoy?" se responda sin navegar a ningún
 * lado. Lleva a la vista completa de turnos (ya filtrada a hoy por
 * default — ver turnos/page.tsx).
 */
export default function TodaySummary({
  businessId,
  bookings,
  nowTime,
}: TodaySummaryProps) {
  const active = bookings.filter((b) => ACTIVE_STATUSES.has(b.status));
  const next = active.find((b) => b.time.slice(0, 5) >= nowTime);

  return (
    <Link
      href={`/admin/negocios/${businessId}/turnos`}
      className="mt-6 flex items-center justify-between gap-4 flex-wrap rounded-sm border border-ink-line bg-ink-elevated px-5 py-4 hover:border-brass transition-colors group"
    >
      <div className="flex items-center gap-4">
        <span className="ticket-number text-3xl text-brass shrink-0">
          {active.length}
        </span>
        <div>
          <p className="text-bone font-medium text-sm">
            {active.length === 0
              ? "Sin turnos para hoy"
              : active.length === 1
                ? "Turno hoy"
                : "Turnos hoy"}
          </p>
          {next ? (
            <p className="text-xs text-bone-muted mt-0.5">
              Próximo: {next.customer_name} · {next.time.slice(0, 5)}
            </p>
          ) : active.length > 0 ? (
            <p className="text-xs text-bone-muted mt-0.5">
              Ya pasaron todos los de hoy
            </p>
          ) : null}
        </div>
      </div>
      <span className="section-eyebrow text-xs text-bone-muted group-hover:text-brass transition-colors shrink-0">
        Ver turnos de hoy →
      </span>
    </Link>
  );
}
