"use client";

import { useState } from "react";
import { Location, Service } from "@/types/business";
import { PublicBooking } from "@/lib/data/business-repository";
import { useBookingModal } from "@/lib/booking-modal-context";
import { cancelBooking, rescheduleBooking } from "@/lib/actions/booking-actions";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { readableTextColor } from "@/lib/format";
import SaveStatus from "@/components/ui/SaveStatus";
import StepDateTime from "@/components/booking/StepDateTime";

interface ManageBookingViewProps {
  booking: PublicBooking;
  primaryColor: string;
  services: Service[];
  locations: Location[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Vista de "mi turno" a la que se llega desde el link de la reserva (sin
 * login — el id de la reserva, no adivinable, es el único token de
 * acceso). Rama según el estado: futuro → cancelar/reprogramar; completo
 * → rebooking; cancelado/no-show → reservar uno nuevo.
 */
export default function ManageBookingView({
  booking: initialBooking,
  primaryColor,
  services,
  locations,
}: ManageBookingViewProps) {
  const [booking, setBooking] = useState(initialBooking);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const { open, openFor } = useBookingModal();
  const cancelStatus = useAsyncStatus();

  const service = services.find((s) => s.id === booking.service_id);
  const location =
    locations.find((l) => l.id === booking.location_id) ?? locations[0];

  const isUpcoming = booking.status === "pending" || booking.status === "confirmed";
  const ctaTextColor = readableTextColor(primaryColor);

  async function handleCancel() {
    if (!confirm("¿Seguro que querés cancelar este turno?")) return;
    const result = await cancelStatus.run(() => cancelBooking(booking.id));
    if (result.success) {
      setBooking((b) => ({ ...b, status: "cancelled" }));
    }
  }

  async function handleRescheduled(date: string, time: string) {
    const result = await rescheduleBooking(booking.id, date, time);
    if (result.success) {
      setBooking((b) => ({ ...b, date, time }));
      setMode("view");
    }
    return result;
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 md:py-24">
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Tu turno
      </p>
      <h1 className="display-title mt-2 text-3xl text-bone">
        {booking.service_name}
      </h1>

      <div className="mt-6 grid gap-1 text-sm">
        <p className="text-bone-muted">
          {formatDateLong(booking.date)} ·{" "}
          <span className="ticket-number">{booking.time.slice(0, 5)}</span>
        </p>
        {booking.professional_name ? (
          <p className="text-bone-muted">Con {booking.professional_name}</p>
        ) : null}
        <p className="text-bone-muted">{booking.business_name}</p>
        <p className="section-eyebrow mt-2" style={{ color: primaryColor }}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </p>
      </div>

      {mode === "reschedule" && service && location ? (
        <div className="mt-8">
          <RescheduleForm
            booking={booking}
            service={service}
            location={location}
            locations={locations}
            primaryColor={primaryColor}
            onDone={handleRescheduled}
            onCancel={() => setMode("view")}
          />
        </div>
      ) : isUpcoming ? (
        <div className="mt-8 flex flex-col gap-2.5 max-w-xs">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="section-eyebrow rounded-sm border border-ink-line px-5 py-3 text-xs text-bone hover:border-brass transition-colors"
          >
            Reprogramar
          </button>
          <button
            type="button"
            disabled={cancelStatus.isPending}
            onClick={handleCancel}
            className="section-eyebrow rounded-sm border border-ink-line px-5 py-3 text-xs text-bone-muted hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
          >
            {cancelStatus.isPending ? "Cancelando..." : "Cancelar turno"}
          </button>
          <SaveStatus status={cancelStatus.status} error={cancelStatus.error} />
        </div>
      ) : booking.status === "completed" ? (
        <div className="mt-8">
          <p className="text-sm text-bone-muted mb-4">¿Querés reservar de nuevo?</p>
          <button
            type="button"
            onClick={() =>
              openFor({
                serviceId: booking.service_id,
                locationId: booking.location_id ?? undefined,
                professionalId: booking.professional_id ?? undefined,
              })
            }
            className="section-eyebrow rounded-sm font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor, color: ctaTextColor }}
          >
            Reservar de nuevo
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <button
            type="button"
            onClick={open}
            className="section-eyebrow rounded-sm font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor, color: ctaTextColor }}
          >
            Reservar un turno
          </button>
        </div>
      )}
    </section>
  );
}

function RescheduleForm({
  booking,
  service,
  location,
  locations,
  primaryColor,
  onDone,
  onCancel,
}: {
  booking: PublicBooking;
  service: Service;
  location: Location;
  locations: Location[];
  primaryColor: string;
  onDone: (
    date: string,
    time: string
  ) => Promise<{ success: boolean; error?: string; conflict?: boolean }>;
  onCancel: () => void;
}) {
  const [locationId, setLocationId] = useState<string | null>(location.id);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!date || !time) return;
    setSubmitting(true);
    setError("");
    const result = await onDone(date, time);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "No se pudo reprogramar.");
      if (result.conflict) setTime(null);
    }
  }

  return (
    <div>
      <StepDateTime
        business={{ id: booking.business_id, primary_color: primaryColor }}
        locations={locations}
        service={service}
        selectedLocationId={locationId}
        selectedDate={date}
        selectedTime={time}
        professionalId={booking.professional_id ?? undefined}
        excludeBookingId={booking.id}
        stepNumber={1}
        onSelectLocation={setLocationId}
        onSelectDate={(d) => {
          setDate(d);
          setTime(null);
        }}
        onSelectTime={setTime}
      />
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!date || !time || submitting}
          onClick={handleConfirm}
          className="section-eyebrow flex-1 text-xs px-5 py-3 rounded-sm font-semibold disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: primaryColor, color: readableTextColor(primaryColor) }}
        >
          {submitting ? "Guardando..." : "Confirmar nuevo horario"}
        </button>
      </div>
    </div>
  );
}
