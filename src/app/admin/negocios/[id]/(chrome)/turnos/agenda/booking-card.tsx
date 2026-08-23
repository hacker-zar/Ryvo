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
 * Card compacta de un turno — nombre, servicio, hora-hora fin.
 * `cancelled`/`no_show` bajan de opacidad y NO se marcan con el color de
 * estado a la izquierda (para que de un vistazo se lean como "ya no
 * activos", no como turnos vigentes más) — el resto sí lo tiene.
 *
 * Tipografía: DOS tamaños, no cuatro. Antes esta card apilaba 12/11/10/9px
 * — cinco líneas, cuatro tamaños, tres de ellos por debajo del piso de
 * lectura, sobre unos 60px de alto. Eso no crea jerarquía, crea ruido: en
 * un espacio así la jerarquía se hace con PESO y COLOR, que es lo que
 * hace ahora (13px/600 para el nombre, 11px/400 apagado para el resto).
 *
 * El estado ya no se escribe: la franja de color del borde izquierdo lo
 * comunica, y repetirlo en texto de 9px era gastar la línea más chica de
 * la card en información redundante. Se conserva en `title` y como texto
 * accesible para lectores de pantalla, que sí lo necesitan.
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
  const statusLabel = STATUS_LABELS[booking.status];

  return (
    <button
      type="button"
      onClick={onClick}
      title={statusLabel}
      style={{
        ...style,
        borderLeftColor: isInactive ? "var(--ink-line)" : accentColor,
      }}
      className={`text-left radius-sm border border-ink-line bg-ink-elevated px-2 py-1.5 overflow-hidden border-l-[3px] hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass transition-colors ${
        isInactive ? "opacity-50" : ""
      } ${className ?? ""}`}
    >
      <p className="text-[13px] font-semibold text-bone truncate leading-tight">
        {booking.customer_name}
      </p>
      <p className="text-[11px] text-bone-muted truncate leading-tight mt-0.5">
        {booking.service_name}
      </p>
      <p className="ticket-number text-[11px] text-bone-muted/80 leading-tight mt-0.5">
        {booking.time.slice(0, 5)}–{endTime}
      </p>
      {showProfessional && booking.professional_name ? (
        <p className="text-[11px] text-bone-muted/70 truncate leading-tight mt-0.5">
          {booking.professional_name}
        </p>
      ) : null}
      {/* El estado se ve en la franja del borde, pero un lector de
          pantalla no la percibe — de ahí este texto solo-accesible. */}
      <span className="sr-only">{statusLabel}</span>
    </button>
  );
}
