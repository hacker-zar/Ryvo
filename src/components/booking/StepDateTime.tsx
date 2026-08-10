"use client";

import { useEffect, useState } from "react";
import { Business, Location, Service } from "@/types/business";
import { getAvailableSlots } from "@/lib/actions/availability-actions";
import MiniCalendar from "./MiniCalendar";

interface StepDateTimeProps {
  business: Pick<Business, "id" | "primary_color">;
  locations: Location[];
  service: Service;
  selectedLocationId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
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
  onSelectLocation,
  onSelectDate,
  onSelectTime,
}: StepDateTimeProps) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsKey, setSlotsKey] = useState<string | null>(null);

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
    }).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setSlotsKey(key);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, activeLocation, business.id, service.duration]);

  // Mientras llega la respuesta para la fecha/local actuales, no mostramos
  // los horarios de la consulta anterior (evita un parpadeo de datos viejos).
  // Si hay fecha/local elegidos pero la key todavía no coincide, está cargando.
  const currentKey = activeLocation ? `${activeLocation.id}|${selectedDate}` : null;
  const loadingSlots = currentKey !== null && slotsKey !== currentKey;
  const visibleSlots = slotsKey === currentKey ? slots : null;

  return (
    <div>
      <p className="section-eyebrow" style={{ color: business.primary_color }}>
        Paso 2
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Fecha y hora</h3>

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
                  onClick={() => {
                    onSelectLocation(loc.id);
                    onSelectTime("");
                  }}
                  className="rounded-sm border px-3.5 py-2.5 text-xs transition-colors"
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
          {loadingSlots ? (
            <p className="text-sm text-bone-muted">Buscando horarios...</p>
          ) : visibleSlots && visibleSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {visibleSlots.map((slot) => {
                const selected = slot === selectedTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectTime(slot)}
                    className="ticket-number rounded-sm border py-2.5 text-xs transition-colors"
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
