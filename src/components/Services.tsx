"use client";

import { Business, Service, TemplateLayoutId } from "@/types/business";
import { formatDuration, formatPrice, readableTextColor } from "@/lib/format";
import { useBookingModal } from "@/lib/booking-modal-context";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";

interface ServicesProps {
  services: Service[];
  primaryColor: Business["primary_color"];
  layout?: TemplateLayoutId;
}

export default function Services({ services, primaryColor, layout }: ServicesProps) {
  const { open } = useBookingModal();

  if (services.length === 0) return null;

  const staggerDelay = (index: number) => 100 + Math.min(index, 5) * 60;

  const reserveButton = (
    <button
      type="button"
      onClick={open}
      className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
      style={{ backgroundColor: primaryColor, color: readableTextColor(primaryColor) }}
    >
      Reservar turno
    </button>
  );

  // === NOIR / STUDIO — grilla de cards (oscuras de alto contraste en
  // Noir, limpias y claras en Studio) en vez de la lista editorial de
  // siempre — es la diferencia estructural real pedida para ambas. ===
  if (layout === "noir" || layout === "studio") {
    const dark = layout === "noir";
    return (
      <section id="servicios" className="mx-auto max-w-5xl px-4 section-y">
        <SectionHeader
          eyebrow="Carta"
          title="Servicios"
          primaryColor={primaryColor}
          layout={layout}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={staggerDelay(i)}>
              <div
                data-editable-category="servicios"
                data-editable-item={service.id}
                className={
                  dark
                    ? "bg-ink-elevated border border-ink-line p-6 h-full"
                    : "border border-ink-line p-6 h-full radius-sm"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="display-title text-xl text-bone">{service.name}</h3>
                  <span className="ticket-number text-lg shrink-0" style={{ color: primaryColor }}>
                    {formatPrice(service.price)}
                  </span>
                </div>
                {service.description ? (
                  <p className="mt-2 text-sm text-bone-muted leading-relaxed">{service.description}</p>
                ) : null}
                {service.duration != null ? (
                  <span className="mt-4 block text-xs text-bone-muted/70">
                    {formatDuration(service.duration)}
                  </span>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={staggerDelay(services.length)}>
          <div className="mt-10 flex justify-center md:justify-start">{reserveButton}</div>
        </Reveal>
      </section>
    );
  }

  // === BOLD — lista numerada enorme, tipo "01 CORTE / 02 BARBA...". ===
  if (layout === "bold") {
    return (
      <section id="servicios" className="mx-auto max-w-5xl px-4 section-y">
        <SectionHeader
          eyebrow="Carta"
          title="Servicios"
          primaryColor={primaryColor}
          layout={layout}
        />

        <div className="mt-6 border-t border-ink-line">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={staggerDelay(i)}>
              <div
                data-editable-category="servicios"
                data-editable-item={service.id}
                className="border-b border-ink-line py-6 flex items-center gap-6"
              >
                <span
                  className="display-title text-4xl md:text-6xl shrink-0"
                  style={{ color: primaryColor }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="display-title text-2xl md:text-4xl text-bone uppercase truncate">
                    {service.name}
                  </h3>
                  {service.description ? (
                    <p className="mt-1 text-sm text-bone-muted leading-relaxed line-clamp-1">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <span className="ticket-number text-xl md:text-2xl text-bone block">
                    {formatPrice(service.price)}
                  </span>
                  {service.duration != null ? (
                    <span className="text-xs text-bone-muted/70">{formatDuration(service.duration)}</span>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={staggerDelay(services.length)}>
          <div className="mt-10 flex justify-center md:justify-start">{reserveButton}</div>
        </Reveal>
      </section>
    );
  }

  // === Atelier / Editorial / default — la lista editorial de siempre
  // (numeración tipo ticket, primer servicio destacado). Editorial suma
  // más aire y tipografía más grande; Atelier queda prácticamente igual
  // al default (ya era el tratamiento "editorial" pedido para ella). ===
  const isEditorial = layout === "editorial";
  const [featured, ...rest] = services;

  return (
    <section id="servicios" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader
        eyebrow="Carta"
        title="Servicios"
        primaryColor={primaryColor}
        layout={layout}
      />

      <div className="mt-10">
        <Reveal delay={staggerDelay(0)}>
          <div
            data-editable-category="servicios"
            data-editable-item={featured.id}
            className="border-b border-ink-line pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <span className="ticket-number text-sm" style={{ color: primaryColor }}>
                01
              </span>
              <h3
                className={`display-title mt-2 text-bone ${
                  isEditorial ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
                }`}
              >
                {featured.name}
              </h3>
              {featured.description ? (
                <p className="mt-2 max-w-md text-sm md:text-base text-bone-muted leading-relaxed">
                  {featured.description}
                </p>
              ) : null}
              {featured.duration != null ? (
                <span className="mt-2 block text-xs text-bone-muted/70">
                  {formatDuration(featured.duration)}
                </span>
              ) : null}
            </div>
            <span className="ticket-number text-2xl md:text-3xl shrink-0" style={{ color: primaryColor }}>
              {formatPrice(featured.price)}
            </span>
          </div>
        </Reveal>

        {rest.length > 0 ? (
          <div className="divide-y divide-ink-line border-b border-ink-line">
            {rest.map((service, i) => (
              <Reveal key={service.id} delay={staggerDelay(i + 1)}>
                <div
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
                      <span className="ticket-number text-sm shrink-0" style={{ color: primaryColor }}>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    {service.description ? (
                      <p className="mt-1 text-sm text-bone-muted">{service.description}</p>
                    ) : null}
                    {service.duration != null ? (
                      <span className="mt-1 block text-xs text-bone-muted/70">
                        {formatDuration(service.duration)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}

        <Reveal delay={staggerDelay(rest.length + 1)}>
          <div className="mt-8 flex justify-center md:justify-start">{reserveButton}</div>
        </Reveal>
      </div>
    </section>
  );
}
