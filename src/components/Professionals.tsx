import Image from "next/image";
import Link from "next/link";
import { Business, Professional, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";

interface ProfessionalsProps {
  professionals: Professional[];
  primaryColor: Business["primary_color"];
  slug: string;
  // Cambia solo la PRESENTACIÓN de esta sección (foto grande + bio en vez
  // de grilla de equipo) — nunca la lógica del wizard de reserva, que ya
  // se adapta sola por cantidad real de profesionales calificados (ver
  // BookingModal.tsx). Default false: cero cambio para negocios
  // existentes.
  singleSpecialistMode?: boolean;
  layout?: TemplateLayoutId;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Professionals({
  professionals,
  primaryColor,
  slug,
  singleSpecialistMode = false,
  layout,
}: ProfessionalsProps) {
  if (professionals.length === 0) return null;

  // Noir: fotos con borde marcado y esquinas rectas de más contraste,
  // coherente con el resto de la plantilla (cards oscuras, alto
  // contraste) — el resto de la composición (grilla/foto-grande) no
  // cambia, ya la cubre singleSpecialistMode arriba.
  const cardFrame = layout === "noir" ? "ring-1 ring-ink-line" : "";

  if (singleSpecialistMode) {
    const specialist = professionals[0];
    return (
      <section id="profesionales" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <Reveal
          className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:items-center"
        >
          <div
            data-editable-category="profesionales"
            data-editable-item={specialist.id}
            className={`relative aspect-square overflow-hidden bg-ink-elevated max-w-xs md:max-w-none mx-auto md:mx-0 w-full ${cardFrame}`}
          >
            {specialist.photo ? (
              <Image
                src={specialist.photo}
                alt={specialist.name}
                fill
                sizes="(min-width: 768px) 280px, 60vw"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-full w-full items-center justify-center"
              >
                <span
                  className="ticket-number text-5xl"
                  style={{ color: primaryColor }}
                >
                  {initials(specialist.name)}
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="section-eyebrow" style={{ color: primaryColor }}>
              Quién te atiende
            </p>
            <h2 className="display-title mt-2 text-3xl md:text-4xl text-bone">
              {specialist.name}
            </h2>
            {specialist.role ? (
              <p
                className="section-eyebrow mt-2"
                style={{ color: primaryColor }}
              >
                {specialist.role}
              </p>
            ) : null}
            {specialist.bio ? (
              <p className="mt-4 text-sm md:text-base text-bone-muted leading-relaxed">
                {specialist.bio}
              </p>
            ) : null}
            {specialist.experience ? (
              <p className="mt-3 text-xs text-bone-muted/80">
                {specialist.experience}
              </p>
            ) : null}
          </div>
        </Reveal>
      </section>
    );
  }

  return (
    <section id="profesionales" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <Reveal>
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          El equipo
        </p>
        <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
          Profesionales
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {professionals.map((professional, i) => (
          <Reveal
            key={professional.id}
            delay={100 + Math.min(i, 5) * 60}
          >
            <div
              data-editable-category="profesionales"
              data-editable-item={professional.id}
            >
              <div className={`relative aspect-square overflow-hidden bg-ink-elevated ${cardFrame}`}>
                {professional.photo ? (
                  <Image
                    src={professional.photo}
                    alt={professional.name}
                    fill
                    sizes="(min-width: 768px) 30vw, 45vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex h-full w-full items-center justify-center"
                  >
                    <span
                      className="ticket-number text-3xl"
                      style={{ color: primaryColor }}
                    >
                      {initials(professional.name)}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-bone font-medium">{professional.name}</p>
              {professional.role ? (
                <p
                  className="section-eyebrow mt-1"
                  style={{ color: primaryColor }}
                >
                  {professional.role}
                </p>
              ) : null}
              {professional.bio ? (
                <p className="mt-2 text-sm text-bone-muted leading-relaxed">
                  {professional.bio}
                </p>
              ) : null}
              <Link
                href={`/${slug}/profesionales/${professional.id}`}
                className="section-eyebrow mt-3 inline-block text-xs hover:opacity-80 transition-opacity"
                style={{ color: primaryColor }}
              >
                Ver perfil →
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
