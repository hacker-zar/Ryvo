import { Business } from "@/types/business";
import { dayLabel, whatsappLink } from "@/lib/format";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
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
}

export default function Contact({ business }: ContactProps) {
  const mapsQuery = encodeURIComponent(business.address);

  return (
    <section id="contacto" className="bg-ink-elevated">
      <div className="mx-auto max-w-5xl px-4 section-y">
        <SectionHeader
          eyebrow="Encontranos"
          title="Contacto"
          primaryColor={business.primary_color}
        />

        <Reveal delay={100} className="mt-10">
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
                  data-editable-category="pagina"
                  data-editable-field="whatsapp"
                  className="h-11 w-11 flex items-center justify-center radius-sm border border-ink-line text-bone hover:border-brass hover:text-brass transition-colors"
                >
                  <Icon name="whatsapp" size={20} />
                </a>
              ) : null}

              {business.instagram ? (
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  data-editable-category="pagina"
                  data-editable-field="instagram"
                  className="h-11 w-11 flex items-center justify-center radius-sm border border-ink-line text-bone hover:border-brass hover:text-brass transition-colors"
                >
                  <Icon name="instagram" size={20} />
                </a>
              ) : null}

              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  aria-label="Llamar"
                  title="Llamar"
                  data-editable-category="pagina"
                  data-editable-field="telefono"
                  className="h-11 w-11 flex items-center justify-center radius-sm border border-ink-line text-bone hover:border-brass hover:text-brass transition-colors"
                >
                  <Icon name="phone" size={20} />
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
        </Reveal>
      </div>
    </section>
  );
}
