"use client";

import { CSSProperties } from "react";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { minutesToTime, timeToMinutes } from "@/lib/agenda";
import { STATUS_COLOR, STATUS_LABELS } from "../booking-status";

interface BookingCardProps {
  booking: BookingWithDetails;
  /** Redundante dentro de una columna por profesional (agenda-day
   *  desktop) — relevante en mobile, donde una sola columna mezcla
   *  varios profesionales. */
  showProfessional?: boolean;
  onClick: () => void;
  style?: CSSProperties;
  className?: string;
}

/**
 * Card compacta de un turno — nombre, servicio, hora-hora fin, estado.
 * `cancelled`/`no_show` bajan de opacidad y NO se marcan con el acento
 * de color a la izquierda (para que de un vistazo se lean como "ya no
 * activos", no como turnos vigentes más) — el resto de estados sí lo
 * tiene, discreto pero identificable.
 */
export default function BookingCard({
  booking,
  showProfessional,
  onClick,
  style,
  className,
}: BookingCardProps) {
  const isInactive = booking.status === "cancelled" || booking.status === "no_show";
  const endTime = minutesToTime(
    timeToMinutes(booking.time.slice(0, 5)) + booking.duration_min
  );
  const accentColor = STATUS_COLOR[booking.status];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...style,
        borderLeftColor: isInactive ? "var(--ink-line)" : accentColor,
      }}
      className={`text-left rounded-sm border border-ink-line bg-ink-elevated px-2 py-1.5 overflow-hidden border-l-[3px] hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass transition-colors ${
        isInactive ? "opacity-50" : ""
      } ${className ?? ""}`}
    >
      <p className="text-xs font-medium text-bone truncate leading-tight">
        {booking.customer_name}
      </p>
      <p className="text-[11px] text-bone-muted truncate leading-tight mt-0.5">
        {booking.service_name}
      </p>
      <p className="ticket-number text-[10px] text-bone-muted/80 mt-0.5">
        {booking.time.slice(0, 5)}–{endTime}
      </p>
      {showProfessional && booking.professional_name ? (
        <p className="text-[10px] text-bone-muted/70 truncate mt-0.5">
          {booking.professional_name}
        </p>
      ) : null}
      {!isInactive ? (
        <span className="flex items-center gap-1 mt-1">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[9px] text-bone-muted">
            {STATUS_LABELS[booking.status]}
          </span>
        </span>
      ) : (
        <span className="text-[9px] text-bone-muted mt-1 block">
          {STATUS_LABELS[booking.status]}
        </span>
      )}
    </button>
  );
}
