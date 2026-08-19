import Image from "next/image";
import { Business, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";

interface AboutProps {
  business: Pick<
    Business,
    "name" | "description" | "city" | "gallery" | "about_image" | "primary_color"
  >;
  layout?: TemplateLayoutId;
}

/**
 * Sección "Sobre nosotros": usa `about_image` (elegida explícitamente
 * por el negocio, ver AboutImagePicker en el editor) si está seteada, y
 * si no cae en `gallery[0]` como fallback — ese fallback es lo único que
 * mantiene el comportamiento histórico para negocios que nunca eligieron
 * una imagen propia. Elegir explícitamente desacopla esta sección del
 * orden de la galería: reordenar `gallery` ya no puede cambiar esta foto.
 */
export default function About({ business, layout }: AboutProps) {
  if (!business.description) return null;

  const image = business.about_image || business.gallery?.[0];
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
