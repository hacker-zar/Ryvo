"use client";

import { BookingWithDetails } from "@/lib/data/business-repository";
import { Location, ProfessionalWithServices } from "@/types/business";
import { dayCodeForDate } from "@/lib/availability";
import {
  bookingRange,
  computeFreeGaps,
  minutesToTime,
  timeToMinutes,
} from "@/lib/agenda";
import BookingCard from "./booking-card";

interface AgendaDayProps {
  bookings: BookingWithDetails[];
  professionals: ProfessionalWithServices[];
  locations: Location[];
  selectedDate: string;
  onSelectBooking: (bookingId: string) => void;
}

const PX_PER_MIN = 2;
const HOUR_STEP_MIN = 60;
const UNASSIGNED_COLUMN_ID = "__unassigned__";

interface Column {
  id: string;
  name: string;
}

/**
 * Timeline vertical del día — una columna por profesional (o una sola
 * si el negocio no tiene profesionales cargados), horas en el eje Y
 * proporcional al horario real del local. La altura de cada turno
 * representa su `duration_min` real; nunca se inventa una duración para
 * un booking legado sin ese dato (no debería existir ninguno, pero si
 * apareciera, se lo trata como 30min mínimo visual, nunca como 0).
 *
 * "Libre" (no "Disponible"): estos huecos solo dicen "no hay ningún
 * booking activo acá" — ver computeFreeGaps en lib/agenda.ts. Confirmar
 * que algo se puede reservar ahí es trabajo exclusivo del motor real
 * (getAvailableSlots), que corre recién en el panel de reprogramación/
 * "+ Nuevo turno" — nunca acá.
 */
export default function AgendaDay({
  bookings,
  professionals,
  locations,
  selectedDate,
  onSelectBooking,
}: AgendaDayProps) {
  const location = locations[0];
  const dayCode = dayCodeForDate(selectedDate);
  const dayConfig = location?.opening_hours?.find((oh) => oh.day === dayCode);
  const isClosed = !dayConfig || dayConfig.closed || !dayConfig.open || !dayConfig.close;

  if (isClosed) {
    return (
      <p className="text-sm text-bone-muted border-t border-ink-line pt-6">
        El local no abre este día.
      </p>
    );
  }

  const openMin = timeToMinutes(dayConfig.open);
  const closeMin = timeToMinutes(dayConfig.close);
  const totalHeight = (closeMin - openMin) * PX_PER_MIN;

  const hourMarks: { min: number; label: string }[] = [];
  for (let m = Math.ceil(openMin / HOUR_STEP_MIN) * HOUR_STEP_MIN; m < closeMin; m += HOUR_STEP_MIN) {
    hourMarks.push({ min: m, label: minutesToTime(m) });
  }

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const hasUnassigned = activeBookings.some((b) => !b.professional_id);

  const columns: Column[] =
    professionals.length > 0
      ? [
          ...professionals.map((p) => ({ id: p.id, name: p.name })),
          ...(hasUnassigned ? [{ id: UNASSIGNED_COLUMN_ID, name: "Sin asignar" }] : []),
        ]
      : [{ id: UNASSIGNED_COLUMN_ID, name: "" }];

  function bookingsForColumn(columnId: string): BookingWithDetails[] {
    if (columns.length === 1 && columns[0].id === UNASSIGNED_COLUMN_ID && professionals.length === 0) {
      return bookings;
    }
    if (columnId === UNASSIGNED_COLUMN_ID) {
      return bookings.filter((b) => !b.professional_id);
    }
    return bookings.filter((b) => b.professional_id === columnId);
  }

  function clampedTopHeight(time: string, durationMin: number) {
    const range = bookingRange(time, Math.max(durationMin, 15));
    const top = Math.max(0, (range.start - openMin) * PX_PER_MIN);
    const bottom = Math.min(totalHeight, (range.end - openMin) * PX_PER_MIN);
    return { top, height: Math.max(bottom - top, 34) };
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `48px repeat(${columns.length}, minmax(150px, 1fr))`,
          minWidth: columns.length > 1 ? `${48 + columns.length * 160}px` : undefined,
        }}
      >
        {/* Header: esquina vacía + un nombre por columna. */}
        <div />
        {columns.map((col) => (
          <div key={col.id} className="px-2 pb-2 text-center">
            {col.name ? (
              <p className="section-eyebrow text-xs text-bone truncate">{col.name}</p>
            ) : null}
          </div>
        ))}

        {/* Columna de horas — una sola, compartida visualmente. */}
        <div className="relative" style={{ height: totalHeight }}>
          {hourMarks.map((h) => (
            <span
              key={h.min}
              className="ticket-number absolute right-2 -translate-y-1/2 text-[10px] text-bone-muted"
              style={{ top: (h.min - openMin) * PX_PER_MIN }}
            >
              {h.label}
            </span>
          ))}
        </div>

        {columns.map((col) => {
          const colBookings = bookingsForColumn(col.id);
          const bookedRanges = colBookings
            .filter((b) => b.status !== "cancelled")
            .map((b) => bookingRange(b.time.slice(0, 5), Math.max(b.duration_min, 15)));
          const gaps = computeFreeGaps(openMin, closeMin, bookedRanges);

          return (
            <div
              key={col.id}
              className="relative border-l border-ink-line"
              style={{ height: totalHeight }}
            >
              {hourMarks.map((h) => (
                <div
                  key={h.min}
                  className="absolute left-0 right-0 border-t border-ink-line/50"
                  style={{ top: (h.min - openMin) * PX_PER_MIN }}
                />
              ))}

              {gaps.map((gap, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="absolute left-1 right-1 flex items-center justify-center rounded-sm text-[9px] text-bone-muted/40"
                  style={{
                    top: (gap.start - openMin) * PX_PER_MIN,
                    height: (gap.end - gap.start) * PX_PER_MIN,
                  }}
                >
                  {gap.end - gap.start >= 30 ? "Libre" : ""}
                </div>
              ))}

              {colBookings.map((booking) => {
                const { top, height } = clampedTopHeight(
                  booking.time.slice(0, 5),
                  booking.duration_min
                );
                return (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showProfessional={columns.length === 1 && professionals.length > 1}
                    onClick={() => onSelectBooking(booking.id)}
                    style={{ position: "absolute", top, height, left: 4, right: 4 }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
