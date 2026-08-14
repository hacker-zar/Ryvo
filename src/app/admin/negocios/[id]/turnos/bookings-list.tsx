"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { adminUpdateBookingStatus } from "@/lib/admin/actions";

interface BookingsListProps {
  businessId: string;
  bookings: BookingWithDetails[];
  selectedDate?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
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

export default function BookingsList({
  businessId,
  bookings,
  selectedDate,
}: BookingsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(selectedDate ?? "");

  function applyDateFilter(date: string) {
    setDateInput(date);
    const url = date
      ? `/admin/negocios/${businessId}/turnos?date=${date}`
      : `/admin/negocios/${businessId}/turnos`;
    router.push(url);
  }

  function handleStatusChange(
    bookingId: string,
    status: "confirmed" | "cancelled"
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
            value={dateInput}
            onChange={(e) => applyDateFilter(e.target.value)}
            className="rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone focus:outline-none focus:border-brass transition-colors"
          />
        </div>
        {dateInput ? (
          <button
            type="button"
            onClick={() => applyDateFilter("")}
            className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors mt-5"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className="mt-6 divide-y divide-ink-line border-t border-b border-ink-line">
        {bookings.length === 0 ? (
          <p className="py-6 text-sm text-bone-muted">
            {selectedDate
              ? `No hay turnos para ${formatDateLong(selectedDate)}.`
              : "Todavía no hay turnos reservados."}
          </p>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="py-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="ticket-number text-sm text-bone">
                    {formatDateLong(booking.date)} · {booking.time.slice(0, 5)}
                  </span>
                  <span
                    className="section-eyebrow text-[10px] px-2 py-0.5 rounded-sm"
                    style={{
                      color:
                        booking.status === "cancelled"
                          ? "#f87171"
                          : booking.status === "confirmed"
                            ? "var(--brass)"
                            : "var(--bone-muted)",
                      border: "1px solid currentColor",
                    }}
                  >
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>
                <p className="text-bone font-medium text-sm mt-1.5">
                  {booking.customer_name} · {booking.customer_phone}
                </p>
                <p className="text-xs text-bone-muted mt-1">
                  {booking.service_name} · {booking.location_name}
                </p>
                {booking.customer_email ? (
                  <p className="text-xs text-bone-muted mt-0.5">
                    {booking.customer_email}
                  </p>
                ) : null}
              </div>

              {booking.status !== "cancelled" ? (
                <div className="flex gap-2 shrink-0">
                  {booking.status !== "confirmed" ? (
                    <button
                      type="button"
                      disabled={isPending && pendingId === booking.id}
                      onClick={() => handleStatusChange(booking.id, "confirmed")}
                      className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPending && pendingId === booking.id}
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                    className="section-eyebrow text-[10px] px-3 py-2 rounded-sm border border-ink-line text-bone-muted hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
