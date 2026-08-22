"use client";

import Link, { useLinkStatus } from "next/link";
import { BookableService, Business, Location } from "@/types/business";
import { readableTextColor, whatsappLink } from "@/lib/format";

interface StepSuccessProps {
  business: Pick<Business, "name" | "primary_color" | "whatsapp">;
  slug: string;
  /** Null si el upsert de la reserva no devolvió id (no debería pasar en
   *  modo real, pero el link "Gestionar mi turno" simplemente no se
   *  muestra en ese caso en vez de romper la pantalla de éxito). */
  bookingId: string | null;
  service: BookableService;
  location: Location;
  date: string;
  time: string;
  onClose: () => void;
}

// El flujo de "Gestionar mi turno" en sí funciona (navega a
// /[slug]/turno/[id]): lo verificado como problema real es la falta de
// feedback durante esa navegación (Server Component, puede tardar un
// instante en 3G/4G) — sin esto, un tap en mobile "no parece hacer nada"
// hasta que la página nueva termina de cargar. `useLinkStatus` (Next.js)
// es el primitivo oficial para esto, cero librería nueva.
function ManageBookingLabel() {
  const { pending } = useLinkStatus();
  return <>{pending ? "Abriendo…" : "Gestionar mi turno"}</>;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

// Sin librería: Google Calendar acepta un link con los datos del evento
// como query params, sin necesidad de credenciales ni API.
function googleCalendarUrl(opts: {
  title: string;
  details: string;
  location: string;
  date: string;
  time: string;
  durationMin: number;
}): string {
  const [y, m, d] = opts.date.split("-").map(Number);
  const [h, min] = opts.time.split(":").map(Number);
  const start = new Date(y, m - 1, d, h, min);
  const end = new Date(start.getTime() + opts.durationMin * 60000);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(
      dt.getDate()
    ).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}${String(
      dt.getMinutes()
    ).padStart(2, "0")}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: opts.details,
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function StepSuccess({
  business,
  slug,
  bookingId,
  service,
  location,
  date,
  time,
  onClose,
}: StepSuccessProps) {
  const calendarUrl = googleCalendarUrl({
    title: `${service.name} — ${business.name}`,
    details: `Turno reservado en ${business.name}.`,
    location: location.name,
    date,
    time,
    durationMin: service.duration,
  });

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

      <div className="mt-6 flex flex-col gap-2.5 max-w-xs mx-auto">
        {business.whatsapp ? (
          <a
            href={whatsappLink(
              business.whatsapp,
              `Hola! Quiero confirmar mi turno de ${service.name} el ${formatDateLong(
                date
              )} a las ${time}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="section-eyebrow rounded-sm border border-ink-line px-5 py-3 text-xs text-bone hover:border-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Confirmar por WhatsApp
          </a>
        ) : null}
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="section-eyebrow rounded-sm border border-ink-line px-5 py-3 text-xs text-bone hover:border-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
        >
          Agregar al calendario
        </a>
        {bookingId ? (
          <Link
            href={`/${slug}/turno/${bookingId}`}
            className="section-eyebrow rounded-sm border border-ink-line px-5 py-3 text-xs text-bone hover:border-brass active:opacity-60 focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            <ManageBookingLabel />
          </Link>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="section-eyebrow mt-6 rounded-sm font-semibold text-xs px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-opacity"
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
