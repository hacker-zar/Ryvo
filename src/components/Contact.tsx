import { Business } from "@/types/business";
import { dayLabel, readableTextColor, whatsappLink } from "@/lib/format";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import SiteQrBlock from "@/components/SiteQrBlock";
import Icon from "@/components/ui/Icon";

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
  /** URL pública absoluta actual del negocio, para el QR de demo — ver
   *  SiteQrBlock.tsx y getPublicSiteUrl en lib/site-url.ts. */
  publicSiteUrl: string;
}

export default function Contact({ business, publicSiteUrl }: ContactProps) {
  const mapsQuery = encodeURIComponent(business.address);
  // Mismo formato de botón que usaba el CTA de Instagram de SocialGrid
  // (píldora, fondo primary_color, texto legible calculado) — unificado
  // acá para los 3 links de contacto en vez del botón cuadrado de solo
  // ícono que tenían antes.
  const contactButtonClasses =
    "section-eyebrow text-xs px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity";
  const contactButtonStyle = {
    backgroundColor: business.primary_color,
    color: readableTextColor(business.primary_color),
  };

  return (
    <section id="contacto" className="bg-ink-elevated">
      <div className="mx-auto max-w-5xl px-4 section-y">
        <SectionHeader
          eyebrow="Encontranos"
          title="Contacto"
          primaryColor={business.primary_color}
        />

        <Reveal delay={100} className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="grid gap-4 max-w-md">
            {business.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                data-editable-category="pagina"
                data-editable-field="direccion"
                className="text-sm text-bone hover:text-brass transition-colors"
              >
                {business.address}
              </a>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {business.whatsapp ? (
                <a
                  href={whatsappLink(
                    business.whatsapp,
                    `Hola! Quiero consultar sobre un turno en ${business.name}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-editable-category="pagina"
                  data-editable-field="whatsapp"
                  className={contactButtonClasses}
                  style={contactButtonStyle}
                >
                  <Icon name="whatsapp" size={16} className="shrink-0" />
                  WhatsApp
                </a>
              ) : null}

              {business.instagram ? (
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-editable-category="pagina"
                  data-editable-field="instagram"
                  className={contactButtonClasses}
                  style={contactButtonStyle}
                >
                  <Icon name="instagram" size={16} className="shrink-0" />@
                  {business.instagram.replace(/^@/, "")}
                </a>
              ) : null}

              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  data-editable-category="pagina"
                  data-editable-field="telefono"
                  className={contactButtonClasses}
                  style={contactButtonStyle}
                >
                  <Icon name="phone" size={16} className="shrink-0" />
                  Llamar
                </a>
              ) : null}
            </div>

            {business.email ? (
              <a
                href={`mailto:${business.email}`}
                data-editable-category="pagina"
                data-editable-field="email"
                className="text-sm text-bone-muted hover:text-brass transition-colors"
              >
                {business.email}
              </a>
            ) : null}

            {business.opening_hours && business.opening_hours.length > 0 ? (
              <div
                data-editable-category="reservas"
                className="mt-2 pt-4 border-t border-ink-line"
              >
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

          <SiteQrBlock url={publicSiteUrl} />
        </Reveal>
      </div>
    </section>
  );
}
