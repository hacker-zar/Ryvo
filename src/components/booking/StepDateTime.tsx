"use client";

import { useEffect, useState } from "react";
import { BookableService, Business, Location } from "@/types/business";
import { getAvailableSlots } from "@/lib/actions/availability-actions";
import MiniCalendar from "./MiniCalendar";

interface StepDateTimeProps {
  business: Pick<Business, "id" | "primary_color">;
  locations: Location[];
  service: BookableService;
  selectedLocationId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  /** "Este horario acaba de ocuparse" — llega desde BookingModal cuando
   *  confirmar el paso 3 devolvió un conflicto (ver createBooking). */
  conflictMessage?: string;
  /** Reserva con UN profesional específico — acota los horarios a los
   *  suyos. Ninguno de los dos = negocio sin profesionales, mismo
   *  comportamiento de siempre. */
  professionalId?: string;
  /** "Cualquiera disponible" — unión de disponibilidad entre estos. */
  qualifiedProfessionalIds?: string[];
  /** Reprogramar: excluye la propia reserva actual de los horarios
   *  ocupados, para que no se vea bloqueada a sí misma. */
  excludeBookingId?: string;
  stepNumber: number;
  onSelectLocation: (locationId: string) => void;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export default function StepDateTime({
  business,
  locations,
  service,
  selectedLocationId,
  selectedDate,
  selectedTime,
  conflictMessage,
  professionalId,
  qualifiedProfessionalIds,
  excludeBookingId,
  stepNumber,
  onSelectLocation,
  onSelectDate,
  onSelectTime,
}: StepDateTimeProps) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsKey, setSlotsKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pulsingLocationId, setPulsingLocationId] = useState<string | null>(
    null
  );
  const [pulsingSlot, setPulsingSlot] = useState<string | null>(null);

  function handleSelectLocation(locId: string) {
    onSelectLocation(locId);
    onSelectTime("");
    setPulsingLocationId(locId);
    window.setTimeout(() => setPulsingLocationId(null), 200);
  }

  function handleSelectTime(slot: string) {
    onSelectTime(slot);
    setPulsingSlot(slot);
    window.setTimeout(() => setPulsingSlot(null), 200);
  }

  const activeLocation =
    locations.find((l) => l.id === selectedLocationId) ?? locations[0];

  // Si hay un solo local, se selecciona automáticamente y no se muestra selector.
  useEffect(() => {
    if (locations.length === 1 && !selectedLocationId) {
      onSelectLocation(locations[0].id);
    }
  }, [locations, selectedLocationId, onSelectLocation]);

  useEffect(() => {
    if (!selectedDate || !activeLocation) {
      return;
    }
    let cancelled = false;
    const key = `${activeLocation.id}|${selectedDate}`;
    getAvailableSlots({
      businessId: business.id,
      locationId: activeLocation.id.startsWith("virtual-")
        ? null
        : activeLocation.id,
      date: selectedDate,
      serviceDurationMin: service.duration,
      openingHours: activeLocation.opening_hours,
      professionalId,
      qualifiedProfessionalIds,
      excludeBookingId,
    })
      .then((result) => {
        if (!cancelled) {
          setSlots(result);
          setSlotsKey(key);
        }
      })
      .catch(() => {
        if (!cancelled) setErrorKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [
    selectedDate,
    activeLocation,
    business.id,
    service.duration,
    professionalId,
    qualifiedProfessionalIds,
    excludeBookingId,
    retryCount,
  ]);

  // Mientras llega la respuesta para la fecha/local actuales, no mostramos
  // los horarios de la consulta anterior (evita un parpadeo de datos viejos).
  // Si hay fecha/local elegidos pero la key todavía no coincide, está cargando.
  // El error también se deriva comparando keys (en vez de un booleano que
  // haya que resetear a mano) — así una fecha/local nueva nunca arrastra
  // el error de la consulta anterior.
  const currentKey = activeLocation ? `${activeLocation.id}|${selectedDate}` : null;
  const slotsError = errorKey !== null && errorKey === currentKey;
  const loadingSlots = currentKey !== null && slotsKey !== currentKey && !slotsError;
  const visibleSlots = slotsKey === currentKey ? slots : null;

  return (
    <div>
      <p className="section-eyebrow" style={{ color: business.primary_color }}>
        Paso {stepNumber}
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Fecha y hora</h3>

      {conflictMessage ? (
        <p className="mt-3 rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          {conflictMessage}
        </p>
      ) : null}

      {/* Fecha */}
      <p className="text-xs text-bone-muted mt-6 mb-2">Fecha</p>
      <MiniCalendar
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          onSelectDate(date);
          onSelectTime("");
        }}
        openingHours={activeLocation?.opening_hours ?? []}
        primaryColor={business.primary_color}
      />

      {/* Local (solo si hay más de uno) */}
      {locations.length > 1 ? (
        <>
          <p className="text-xs text-bone-muted mt-6 mb-2">Local</p>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => {
              const selected = loc.id === selectedLocationId;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc.id)}
                  className={`rounded-sm border px-3.5 py-2.5 text-xs transition-colors ${
                    pulsingLocationId === loc.id ? "select-pulse" : ""
                  }`}
                  style={{
                    borderColor: selected
                      ? business.primary_color
                      : "var(--ink-line)",
                    backgroundColor: selected
                      ? "color-mix(in srgb, var(--brass) 10%, transparent)"
                      : "transparent",
                    color: selected ? business.primary_color : "var(--bone)",
                  }}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Hora */}
      {selectedDate ? (
        <>
          <p className="text-xs text-bone-muted mt-6 mb-2">Horario</p>
          {slotsError ? (
            <div className="text-sm text-bone-muted">
              <p>No pudimos cargar los horarios disponibles.</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="section-eyebrow mt-2 text-xs px-4 py-2 rounded-sm border border-ink-line text-bone hover:border-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : loadingSlots ? (
            <p className="text-sm text-bone-muted">Buscando horarios...</p>
          ) : visibleSlots && visibleSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {visibleSlots.map((slot) => {
                const selected = slot === selectedTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectTime(slot)}
                    className={`ticket-number rounded-sm border py-2.5 text-xs transition-colors ${
                      pulsingSlot === slot ? "select-pulse" : ""
                    }`}
                    style={{
                      borderColor: selected
                        ? business.primary_color
                        : "var(--ink-line)",
                      backgroundColor: selected
                        ? business.primary_color
                        : "transparent",
                      color: selected ? "var(--ink)" : "var(--bone)",
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : visibleSlots && visibleSlots.length === 0 ? (
            <p className="text-sm text-bone-muted">
              No hay horarios disponibles ese día. Probá con otra fecha.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
