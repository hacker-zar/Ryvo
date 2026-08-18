import Image from "next/image";
import { Business, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";

interface AboutProps {
  business: Pick<
    Business,
    "name" | "description" | "city" | "gallery" | "primary_color"
  >;
  layout?: TemplateLayoutId;
}

/**
 * Sección "Sobre nosotros": usa exclusivamente datos que ya existen
 * (description, city, y la primera foto de gallery como imagen editorial).
 * No agrega ningún campo ni tabla nueva al modelo de datos.
 */
export default function About({ business, layout }: AboutProps) {
  if (!business.description) return null;

  const image = business.gallery?.[0];
  const isAtelier = layout === "atelier";

  return (
    <section className={isAtelier ? "bg-ink" : "bg-ink-elevated"}>
      <div className={`mx-auto max-w-5xl px-4 ${isAtelier ? "py-20 md:py-32" : "py-16 md:py-24"}`}>
        <div
          className={`grid items-center gap-10 ${
            image ? "md:grid-cols-2 md:gap-16" : "max-w-2xl"
          }`}
        >
          <Reveal>
            <p className="section-eyebrow" style={{ color: business.primary_color }}>
              Quiénes somos
            </p>
            <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
              Sobre {business.name}
            </h2>
            <p
              data-editable-category="pagina"
              data-editable-field="bio"
              className="mt-6 text-base md:text-lg text-bone-muted leading-relaxed max-w-lg"
            >
              {business.description}
            </p>
            {business.city ? (
              <p className="section-eyebrow mt-4 text-bone-muted/70">
                {business.city}
              </p>
            ) : null}
          </Reveal>

          {image ? (
            <Reveal
              delay={100}
              className="relative aspect-[4/5] md:aspect-square overflow-hidden bg-ink-elevated order-first md:order-last"
            >
              <Image
                src={image}
                alt={business.name}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
