"use client";

import Image from "next/image";
import { Business, ProfessionalWithServices, Service } from "@/types/business";
import { formatDuration, formatPrice, readableTextColor } from "@/lib/format";
import { useBookingModal } from "@/lib/booking-modal-context";
import Reveal from "@/components/Reveal";

interface ProfessionalProfileProps {
  professional: ProfessionalWithServices;
  services: Service[];
  primaryColor: Business["primary_color"];
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Perfil público de un profesional individual — reutiliza el mismo
 *  lenguaje visual que Services.tsx/Professionals.tsx (ticket-number,
 *  section-eyebrow, mismo fallback de iniciales), sin inventar estilos
 *  nuevos. Estructura de reviews queda deliberadamente afuera — un
 *  futuro Review.professional_id encajaría acá sin fricción. */
export default function ProfessionalProfile({
  professional,
  services,
  primaryColor,
}: ProfessionalProfileProps) {
  const { openFor } = useBookingModal();
  const firstName = professional.name.split(" ")[0];

  return (
    <section className="mx-auto max-w-3xl px-4 section-y">
      <Reveal>
        <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
          <div className="image-frame relative aspect-square overflow-hidden bg-ink-elevated">
            {professional.photo ? (
              <Image
                src={professional.photo}
                alt={professional.name}
                fill
                sizes="220px"
                className="object-cover"
              />
            ) : (
              <div aria-hidden className="flex h-full w-full items-center justify-center">
                <span className="ticket-number text-4xl" style={{ color: primaryColor }}>
                  {initials(professional.name)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="display-title text-3xl md:text-4xl text-bone">
              {professional.name}
            </h1>
            {professional.role ? (
              <p className="section-eyebrow mt-2" style={{ color: primaryColor }}>
                {professional.role}
              </p>
            ) : null}
            {professional.experience ? (
              <p className="text-xs text-bone-muted mt-1">{professional.experience}</p>
            ) : null}
            {professional.bio ? (
              <p className="mt-4 text-sm text-bone-muted leading-relaxed">
                {professional.bio}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => openFor({ professionalId: professional.id })}
              className="section-eyebrow mt-6 text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor, color: readableTextColor(primaryColor) }}
            >
              Reservar con {firstName}
            </button>
          </div>
        </div>
      </Reveal>

      {services.length > 0 ? (
        <Reveal delay={100} className="mt-14">
          <p className="section-eyebrow" style={{ color: primaryColor }}>
            Servicios
          </p>
          <div className="mt-4 divide-y divide-ink-line border-t border-b border-ink-line">
            {services.map((service, i) => (
              <div key={service.id} className="flex items-start gap-5 py-5">
                <span
                  className="ticket-number text-sm md:text-base pt-0.5 w-9 shrink-0"
                  style={{ color: primaryColor }}
                >
                  {String(i + 1).padStart(2, "0")}
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
                  {service.duration != null ? (
                    <span className="mt-1 block text-xs text-bone-muted/70">
                      {formatDuration(service.duration)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
