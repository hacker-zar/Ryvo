"use client";

import { useEffect, useState } from "react";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { Location, ProfessionalWithServices } from "@/types/business";
import { adminRescheduleBooking } from "@/lib/admin/actions";
import { getAvailableSlots } from "@/lib/actions/availability-actions";
import { qualifiedProfessionalIds } from "@/lib/availability";
import MiniCalendar from "@/components/booking/MiniCalendar";

interface ReschedulePanelProps {
  businessId: string;
  booking: BookingWithDetails;
  professionals: ProfessionalWithServices[];
  locations: Location[];
  onCancel: () => void;
  onDone: () => void;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Reprograma reutilizando exactamente el motor real de disponibilidad —
 * `getAvailableSlots`, el MISMO Server Action que ya usa StepDateTime en
 * el wizard público (ver lib/actions/availability-actions.ts). Los
 * horarios que se listan acá SÍ dicen "Disponible" porque el motor real
 * ya los confirmó — a diferencia de los huecos "Libre" del timeline, que
 * son solo "no hay nada agendado ahí" (ver agenda-day.tsx/lib/agenda.ts).
 *
 * Nunca aplica en silencio: pide confirmación explícita (actual vs.
 * nuevo) antes de llamar a `adminRescheduleBooking`.
 */
export default function ReschedulePanel({
  businessId,
  booking,
  professionals,
  locations,
  onCancel,
  onDone,
}: ReschedulePanelProps) {
  const location = locations.find((l) => l.id === booking.location_id) ?? locations[0];
  const qualifiedIds = qualifiedProfessionalIds(professionals, booking.service_id);
  const eligibleProfessionals = professionals.filter(
    (p) => p.active && (qualifiedIds.includes(p.id) || p.id === booking.professional_id)
  );

  const [date, setDate] = useState(booking.date);
  const [professionalId, setProfessionalId] = useState<string | null>(
    booking.professional_id ?? null
  );
  const [time, setTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Mismo patrón que StepDateTime.tsx (wizard público): en vez de
  // "limpiar" slots/time sincrónicamente adentro del efecto que dispara
  // el fetch (dispara renders en cascada), se compara una `key` derivada
  // de fecha+profesional contra la key de la última respuesta ya
  // recibida — los datos de la key anterior nunca se muestran como si
  // fueran de la actual. `time` se limpia en los propios handlers que
  // cambian fecha/profesional (abajo), no acá.
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsKey, setSlotsKey] = useState<string | null>(null);
  const currentKey = location ? `${location.id}|${date}|${professionalId ?? "none"}` : null;
  const loadingSlots = currentKey !== null && slotsKey !== currentKey;
  const visibleSlots = slotsKey === currentKey ? slots : null;

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    const key = `${location.id}|${date}|${professionalId ?? "none"}`;
    getAvailableSlots({
      businessId,
      locationId: location.id.startsWith("virtual-") ? null : location.id,
      date,
      serviceDurationMin: booking.duration_min,
      openingHours: location.opening_hours,
      professionalId: professionalId ?? undefined,
      excludeBookingId: booking.id,
    }).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setSlotsKey(key);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [businessId, booking.duration_min, booking.id, date, location, professionalId]);

  function handleSelectDate(nextDate: string) {
    setDate(nextDate);
    setTime(null);
  }

  function handleSelectProfessional(id: string) {
    setProfessionalId(id);
    setTime(null);
  }

  async function confirm() {
    if (!time) return;
    setSubmitting(true);
    setError("");
    const result = await adminRescheduleBooking(
      businessId,
      booking.id,
      date,
      time,
      professionalId
    );
    setSubmitting(false);
    if (result.success) {
      onDone();
    } else if (result.conflict) {
      setError(result.error ?? "Ese horario ya fue reservado. Elegí otro.");
      setConfirming(false);
      setTime(null);
    } else {
      setError(result.error ?? "No se pudo reprogramar.");
    }
  }

  if (confirming && time) {
    const newProfessionalName = professionalId
      ? (professionals.find((p) => p.id === professionalId)?.name ?? "")
      : "Sin asignar";
    return (
      <div>
        <p className="section-eyebrow text-brass">¿Reprogramar turno?</p>
        <div className="mt-4 grid gap-4 text-sm">
          <div>
            <p className="text-xs text-bone-muted">Actual</p>
            <p className="text-bone mt-0.5">
              {formatDateLong(booking.date)} · {booking.time.slice(0, 5)}
              {booking.professional_name ? ` · ${booking.professional_name}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-bone-muted">Nuevo</p>
            <p className="text-bone mt-0.5">
              {formatDateLong(date)} · {time}
              {professionalId ? ` · ${newProfessionalName}` : ""}
            </p>
          </div>
        </div>
        {error ? <p className="text-xs text-red-400 mt-3">{error}</p> : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={confirm}
            className="section-eyebrow text-xs px-4 py-2.5 rounded-sm bg-brass text-ink font-semibold disabled:opacity-50"
          >
            {submitting ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="section-eyebrow text-brass">Reprogramar turno</p>
      <p className="text-xs text-bone-muted mt-1">
        Actual: {formatDateLong(booking.date)} · {booking.time.slice(0, 5)}
      </p>

      {eligibleProfessionals.length > 1 ? (
        <div className="mt-5">
          <p className="text-xs text-bone-muted mb-2">Profesional</p>
          <div className="grid gap-1.5">
            {eligibleProfessionals.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm text-bone cursor-pointer"
                style={{
                  borderColor: professionalId === p.id ? "var(--brass)" : "var(--ink-line)",
                }}
              >
                <input
                  type="radio"
                  name="reschedule_professional"
                  checked={professionalId === p.id}
                  onChange={() => handleSelectProfessional(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-xs text-bone-muted mb-2">Fecha</p>
        <MiniCalendar
          selectedDate={date}
          onSelectDate={handleSelectDate}
          openingHours={location?.opening_hours ?? []}
          primaryColor="var(--brass)"
        />
      </div>

      <div className="mt-5">
        <p className="text-xs text-bone-muted mb-2">Horario</p>
        {loadingSlots ? (
          <p className="text-sm text-bone-muted">Buscando horarios...</p>
        ) : visibleSlots && visibleSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {visibleSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className="ticket-number rounded-sm border py-2 text-xs transition-colors"
                style={{
                  borderColor: time === slot ? "var(--brass)" : "var(--ink-line)",
                  backgroundColor: time === slot ? "var(--brass)" : "transparent",
                  color: time === slot ? "var(--ink)" : "var(--bone)",
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-bone-muted">
            No hay horarios disponibles ese día. Probá con otra fecha.
          </p>
        )}
      </div>

      {error ? <p className="text-xs text-red-400 mt-4">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
        >
          Volver
        </button>
        <button
          type="button"
          disabled={!time}
          onClick={() => setConfirming(true)}
          className="section-eyebrow text-xs px-4 py-2.5 rounded-sm bg-brass text-ink font-semibold disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
