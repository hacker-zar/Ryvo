import { Business, Service } from "@/types/business";
import { formatDuration, formatPrice } from "@/lib/format";

interface ServicesProps {
  services: Service[];
  primaryColor: Business["primary_color"];
}

export default function Services({ services, primaryColor }: ServicesProps) {
  if (services.length === 0) return null;

  return (
    <section id="servicios" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Carta de servicios
      </p>
      <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
        Servicios
      </h2>

      {/* Ficha de turno: referencia directa al numerito de espera real de
          una barbería. El orden de la lista es el orden en que se elige
          el servicio, así que el número tiene sentido informativo, no
          decorativo. */}
      <div className="mt-10 divide-y divide-ink-line border-t border-b border-ink-line">
        {services.map((service, i) => (
          <div
            key={service.id}
            className="group flex items-start gap-5 py-5"
          >
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
    </section>
  );
}
