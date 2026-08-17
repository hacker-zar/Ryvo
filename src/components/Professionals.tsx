import Image from "next/image";
import { Business, Professional } from "@/types/business";
import Reveal from "@/components/Reveal";

interface ProfessionalsProps {
  professionals: Professional[];
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

export default function Professionals({
  professionals,
  primaryColor,
}: ProfessionalsProps) {
  if (professionals.length === 0) return null;

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

      <Reveal
        delay={100}
        className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3"
      >
        {professionals.map((professional) => (
          <div
            key={professional.id}
            data-editable-category="profesionales"
            data-editable-item={professional.id}
          >
            <div className="relative aspect-square overflow-hidden bg-ink-elevated">
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
          </div>
        ))}
      </Reveal>
    </section>
  );
}
