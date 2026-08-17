"use client";

import { Business, Service } from "@/types/business";
import { formatDuration, formatPrice, readableTextColor } from "@/lib/format";
import { useBookingModal } from "@/lib/booking-modal-context";
import Reveal from "@/components/Reveal";

interface ServicesProps {
  services: Service[];
  primaryColor: Business["primary_color"];
}

export default function Services({ services, primaryColor }: ServicesProps) {
  const { open } = useBookingModal();

  if (services.length === 0) return null;

  // El primer servicio de la carta recibe un tratamiento tipográfico mayor
  // (jerarquía visual) sin inventar un campo "destacado" que no existe en
  // el modelo de datos: es el mismo orden que el dueño ya define al cargar
  // servicios, con más protagonismo para el primero.
  const [featured, ...rest] = services;

  return (
    <section id="servicios" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <Reveal>
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          Carta de servicios
        </p>
        <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
          Servicios
        </h2>
      </Reveal>

      <Reveal delay={100} className="mt-10">
        <div
          data-editable-category="servicios"
          data-editable-item={featured.id}
          className="border-b border-ink-line pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <span className="ticket-number text-sm" style={{ color: primaryColor }}>
              01
            </span>
            <h3 className="display-title mt-2 text-2xl md:text-3xl text-bone">
              {featured.name}
            </h3>
            {featured.description ? (
              <p className="mt-2 max-w-md text-sm md:text-base text-bone-muted leading-relaxed">
                {featured.description}
              </p>
            ) : null}
            <span className="mt-2 block text-xs text-bone-muted/70">
              {formatDuration(featured.duration)}
            </span>
          </div>
          <span
            className="ticket-number text-2xl md:text-3xl shrink-0"
            style={{ color: primaryColor }}
          >
            {formatPrice(featured.price)}
          </span>
        </div>

        {rest.length > 0 ? (
          <div className="divide-y divide-ink-line border-b border-ink-line">
            {rest.map((service, i) => (
              <div
                key={service.id}
                data-editable-category="servicios"
                data-editable-item={service.id}
                className="flex items-start gap-5 py-5"
              >
                <span
                  className="ticket-number text-sm md:text-base pt-0.5 w-9 shrink-0"
                  style={{ color: primaryColor }}
                >
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <h3 className="text-bone font-medium">{service.name}</h3>
                    <span
                      className="ticket-number text-sm shrink-0"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="mt-1 text-sm text-bone-muted">
                      {service.description}
                    </p>
                  ) : null}
                  <span className="mt-1 block text-xs text-bone-muted/70">
                    {formatDuration(service.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex justify-center md:justify-start">
          <button
            type="button"
            onClick={open}
            className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: primaryColor,
              color: readableTextColor(primaryColor),
            }}
          >
            Reservar turno
          </button>
        </div>
      </Reveal>
    </section>
  );
}
