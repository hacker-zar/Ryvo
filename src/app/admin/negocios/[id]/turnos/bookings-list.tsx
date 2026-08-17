"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { adminUpdateBookingStatus } from "@/lib/admin/actions";
import { whatsappLink } from "@/lib/format";
import { BookingStatus } from "@/types/business";

interface BookingsListProps {
  businessId: string;
  bookings: BookingWithDetails[];
  /** Fecha efectivamente filtrada — undefined solo cuando viewAll=true. */
  selectedDate?: string;
  today: string;
  nowTime: string;
  viewAll: boolean;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "var(--bone-muted)",
  confirmed: "var(--brass)",
  completed: "#4ade80",
  cancelled: "#f87171",
  no_show: "#fb923c",
};

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const color = STATUS_COLOR[status] ?? "var(--bone-muted)";
  return (
    <span
      className="section-eyebrow text-[10px] px-2 py-0.5 rounded-sm shrink-0"
      style={{ color, border: "1px solid currentColor" }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Un turno "ya pasó" si su fecha es anterior a hoy, o es hoy pero su hora
 *  ya pasó — recién ahí tiene sentido ofrecer marcarlo Completado/No
 *  asistió (completar un turno futuro no tiene sentido). */
function isPast(booking: BookingWithDetails, today: string, nowTime: string): boolean {
  if (booking.date < today) return true;
  if (booking.date > today) return false;
  return booking.time.slice(0, 5) < nowTime;
}

function QuickActions({
  booking,
  today,
  nowTime,
  disabled,
  onStatusChange,
}: {
  booking: BookingWithDetails;
  today: string;
  nowTime: string;
  disabled: boolean;
  onStatusChange: (
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) => void;
}) {
  if (booking.status === "cancelled") return null;
  if (booking.status === "completed" || booking.status === "no_show") return null;

  const past = isPast(booking, today, nowTime);

  return (
    <div className="flex gap-2 flex-wrap">
      {past ? (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange("completed")}
            className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50"
          >
            Completado
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange("no_show")}
            className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone-muted hover:text-orange-400 hover:border-orange-400 transition-colors disabled:opacity-50"
          >
            No asistió
          </button>
        </>
      ) : (
        <>
          {booking.status !== "confirmed" ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange("confirmed")}
              className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50"
            >
              Confirmar
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange("cancelled")}
            className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone-muted hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </>
      )}
      <a
        href={whatsappLink(
          booking.customer_phone,
          `Hola ${booking.customer_name}! Te escribo por tu turno de ${booking.service_name}.`
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone-muted hover:text-brass hover:border-brass transition-colors"
      >
        Contactar
      </a>
    </div>
  );
}

export default function BookingsList({
  businessId,
  bookings,
  selectedDate,
  today,
  nowTime,
  viewAll,
}: BookingsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function goToDate(date: string) {
    const url = date
      ? `/admin/negocios/${businessId}/turnos?date=${date}`
      : `/admin/negocios/${businessId}/turnos?date=all`;
    router.push(url);
  }

  function handleStatusChange(
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) {
    setPendingId(bookingId);
    startTransition(async () => {
      await adminUpdateBookingStatus(businessId, bookingId, status);
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="grid gap-1.5">
          <label htmlFor="date-filter" className="text-xs text-bone-muted">
            Filtrar por día
          </label>
          <input
            id="date-filter"
            type="date"
            value={selectedDate ?? ""}
            onChange={(e) => goToDate(e.target.value)}
            className="rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone focus:outline-none focus:border-brass transition-colors"
          />
        </div>
        {selectedDate !== today ? (
          <button
            type="button"
            onClick={() => goToDate(today)}
            className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors mt-5"
          >
            Hoy
          </button>
        ) : null}
        {!viewAll ? (
          <button
            type="button"
            onClick={() => goToDate("")}
            className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors mt-5"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      {!viewAll && selectedDate ? (
        <p className="section-eyebrow text-brass mt-8">
          {selectedDate === today ? "Hoy · " : ""}
          {formatDateLong(selectedDate)}
        </p>
      ) : null}

      {bookings.length === 0 ? (
        <p className="mt-6 py-6 text-sm text-bone-muted border-t border-ink-line">
          {viewAll
            ? "Todavía no hay turnos reservados."
            : selectedDate === today
              ? "No tenés turnos para hoy."
              : `No hay turnos para ${selectedDate ? formatDateLong(selectedDate) : "esta fecha"}.`}
        </p>
      ) : viewAll ? (
        // Vista "todos": lista compacta multi-día, cronológica.
        <div className="mt-6 divide-y divide-ink-line border-t border-b border-ink-line">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="py-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="ticket-number text-sm text-bone">
                    {formatDateLong(booking.date)} · {booking.time.slice(0, 5)}
                  </span>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-bone font-medium text-sm mt-1.5">
                  {booking.customer_name} · {booking.customer_phone}
                </p>
                <p className="text-xs text-bone-muted mt-1">
                  {booking.service_name} · {booking.location_name}
                </p>
              </div>
              <QuickActions
                booking={booking}
                today={today}
                nowTime={nowTime}
                disabled={isPending && pendingId === booking.id}
                onStatusChange={(status) =>
                  handleStatusChange(booking.id, status)
                }
              />
            </div>
          ))}
        </div>
      ) : (
        // Vista de un día puntual (por defecto, hoy): tarjetas grandes,
        // hora primero — lo que el dueño necesita leer en segundos.
        <div className="mt-4 grid gap-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-sm border border-ink-line bg-ink-elevated p-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div className="flex items-start gap-4">
                <span className="ticket-number text-2xl text-brass shrink-0">
                  {booking.time.slice(0, 5)}
                </span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-bone font-medium text-sm">
                      {booking.customer_name}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-xs text-bone-muted mt-1">
                    {booking.service_name} · {booking.location_name}
                  </p>
                  <p className="text-xs text-bone-muted mt-0.5">
                    {booking.customer_phone}
                  </p>
                </div>
              </div>
              <QuickActions
                booking={booking}
                today={today}
                nowTime={nowTime}
                disabled={isPending && pendingId === booking.id}
                onStatusChange={(status) =>
                  handleStatusChange(booking.id, status)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
