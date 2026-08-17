import { QRCodeSVG } from "qrcode.react";
import { Business } from "@/types/business";
import { dayLabel, whatsappLink } from "@/lib/format";
import Reveal from "@/components/Reveal";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.87 9.87 0 0 0 4.63 1.18h.005c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.24 0 4.35.87 5.94 2.46a8.23 8.23 0 0 1 2.43 5.88c0 4.57-3.72 8.28-8.29 8.28h-.005a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.18.83.85-3.1-.2-.32a8.19 8.19 0 0 1-1.26-4.37c0-4.58 3.72-8.33 8.16-8.33Zm-4.32 4.6c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.7 2.72 4.2 3.71 2.07.82 2.49.66 2.94.62.45-.04 1.45-.6 1.65-1.17.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.71-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.36-.77-1.85-.2-.48-.4-.42-.55-.42Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c-2.717 0-3.056.012-4.123.06-1.064.049-1.791.218-2.427.465a4.902 4.902 0 0 0-1.771 1.153A4.902 4.902 0 0 0 2.526 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.283 2 12s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 0 0 1.153 1.771 4.902 4.902 0 0 0 1.771 1.153c.636.247 1.363.416 2.427.465C8.944 21.988 9.283 22 12 22s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.902 4.902 0 0 0 1.771-1.153 4.902 4.902 0 0 0 1.153-1.771c.247-.636.416-1.363.465-2.427.048-1.067.06-1.406.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 0 0-1.153-1.771A4.902 4.902 0 0 0 18.55 2.526c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.717 2 12 2Zm0 1.802c2.67 0 2.987.01 4.042.059.976.045 1.505.207 1.858.344.467.182.8.399 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.858.048 1.055.059 1.372.059 4.042s-.01 2.987-.059 4.042c-.045.976-.207 1.505-.344 1.858a3.1 3.1 0 0 1-.748 1.15 3.098 3.098 0 0 1-1.15.748c-.353.137-.882.3-1.858.344-1.054.048-1.371.059-4.042.059s-2.987-.01-4.042-.059c-.976-.045-1.505-.207-1.858-.344a3.1 3.1 0 0 1-1.15-.748 3.098 3.098 0 0 1-.748-1.15c-.137-.353-.3-.882-.344-1.858-.048-1.055-.059-1.372-.059-4.042s.01-2.987.059-4.042c.045-.976.207-1.505.344-1.858.182-.467.399-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.137.882-.3 1.858-.344 1.055-.048 1.372-.059 4.042-.059Z" />
      <path d="M12 6.865a5.135 5.135 0 1 0 0 10.27 5.135 5.135 0 0 0 0-10.27Zm0 8.468a3.333 3.333 0 1 1 0-6.666 3.333 3.333 0 0 1 0 6.666Z" />
      <circle cx="17.338" cy="6.662" r="1.2" />
    </svg>
  );
}

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
    <section id="contacto" className="bg-ink-elevated">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <Reveal>
          <p className="section-eyebrow" style={{ color: business.primary_color }}>
            Encontranos
          </p>
          <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
            Contacto
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-10 grid md:grid-cols-2 gap-10">
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
                  aria-label="WhatsApp"
                  title="WhatsApp"
                  className="h-11 w-11 flex items-center justify-center rounded-sm border border-ink-line text-bone hover:border-brass hover:text-brass transition-colors"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              ) : null}

              {business.instagram ? (
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className="h-11 w-11 flex items-center justify-center rounded-sm border border-ink-line text-bone hover:border-brass hover:text-brass transition-colors"
                >
                  <InstagramIcon className="h-5 w-5" />
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

          <div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-ink-line bg-ink p-8">
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
        </Reveal>
      </div>
    </section>
  );
}
