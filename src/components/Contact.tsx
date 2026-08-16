import { QRCodeSVG } from "qrcode.react";
import { Business } from "@/types/business";
import { dayLabel, whatsappLink } from "@/lib/format";

interface ContactProps {
  business: Pick<
    Business,
    | "name"
    | "whatsapp"
    | "instagram"
    | "address"
    | "phone"
    | "email"
    | "opening_hours"
    | "primary_color"
    | "slug"
  >;
  bookingUrl: string;
}

export default function Contact({ business, bookingUrl }: ContactProps) {
  const mapsQuery = encodeURIComponent(business.address);

  return (
    <section id="contacto" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <p className="section-eyebrow" style={{ color: business.primary_color }}>
        Encontranos
      </p>
      <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
        Contacto
      </h2>

      <div className="mt-10 grid md:grid-cols-2 gap-10">
        <div className="grid gap-4">
          {business.address ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-bone hover:text-brass transition-colors"
            >
              {business.address}
            </a>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs">
            {business.whatsapp ? (
              <a
                href={whatsappLink(
                  business.whatsapp,
                  `Hola! Quiero consultar sobre un turno en ${business.name}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="section-eyebrow px-4 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors"
              >
                WhatsApp
              </a>
            ) : null}

            {business.instagram ? (
              <a
                href={`https://instagram.com/${business.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="section-eyebrow px-4 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors"
              >
                Instagram
              </a>
            ) : null}

            {business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="section-eyebrow px-4 py-2 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors"
              >
                Llamar
              </a>
            ) : null}
          </div>

          {business.email ? (
            <a
              href={`mailto:${business.email}`}
              className="text-sm text-bone-muted hover:text-brass transition-colors"
            >
              {business.email}
            </a>
          ) : null}

          {business.opening_hours && business.opening_hours.length > 0 ? (
            <div className="mt-2 pt-4 border-t border-ink-line">
              <p className="section-eyebrow text-bone-muted mb-3">
                Horarios
              </p>
              <ul className="text-sm text-bone-muted space-y-1.5">
                {business.opening_hours.map((oh) => (
                  <li key={oh.day} className="flex justify-between max-w-xs">
                    <span className="text-bone">{dayLabel(oh.day)}</span>
                    <span className="ticket-number">
                      {oh.closed ? "Cerrado" : `${oh.open} – ${oh.close}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-ink-line bg-ink-elevated p-8">
          <div className="bg-bone p-3 rounded-sm">
            <QRCodeSVG
              value={bookingUrl}
              size={150}
              fgColor="#1a1815"
              bgColor="#f7f4ee"
            />
          </div>
          <p className="section-eyebrow text-bone-muted text-center text-[10px]">
            Escaneá para reservar
          </p>
        </div>
      </div>
    </section>
  );
}
