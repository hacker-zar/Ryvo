"use client";

import { Business, Location, Service } from "@/types/business";
import { readableTextColor } from "@/lib/format";

interface StepSuccessProps {
  business: Pick<Business, "primary_color">;
  service: Service;
  location: Location;
  date: string;
  time: string;
  onClose: () => void;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

export default function StepSuccess({
  business,
  service,
  location,
  date,
  time,
  onClose,
}: StepSuccessProps) {
  return (
    <div className="text-center py-6">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brass) 18%, transparent)",
          color: business.primary_color,
        }}
      >
        ✓
      </div>

      <h3 className="section-title mt-5 text-xl text-bone">
        Turno confirmado
      </h3>

      <div className="mt-6 grid gap-1 text-sm">
        <p className="text-bone font-medium">{service.name}</p>
        <p className="text-bone-muted">
          {formatDateLong(date)} · <span className="ticket-number">{time}</span>
        </p>
        <p className="text-bone-muted">{location.name}</p>
      </div>

      <p className="mt-6 text-sm text-bone-muted">Te esperamos.</p>

      <button
        type="button"
        onClick={onClose}
        className="section-eyebrow mt-8 rounded-sm font-semibold text-xs px-7 py-3.5 hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: business.primary_color,
          color: readableTextColor(business.primary_color),
        }}
      >
        Cerrar
      </button>
    </div>
  );
}
