"use client";

import { useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";

interface GalleryProps {
  images: NonNullable<Business["gallery"]>;
  businessName: string;
  primaryColor: Business["primary_color"];
}

// Patrón de mosaico editorial para desktop: algunas fotos ocupan más
// espacio que otras en vez de una grilla pareja de cuadraditos. Se repite
// cada 6 imágenes para que el ritmo se mantenga con cualquier cantidad de
// fotos que cargue el negocio.
const FEATURE_PATTERN = [true, false, false, true, false, false];

export default function Gallery({
  images,
  businessName,
  primaryColor,
}: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <section id="galeria" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div data-editable-category="apariencia" data-editable-field="galeria">
            <p className="section-eyebrow" style={{ color: primaryColor }}>
              Trabajos
            </p>
            <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
              Galería
            </h2>
          </div>
        </Reveal>
      </div>

      {/* Mobile: filmstrip horizontal con peek — se mantiene tal cual
          funcionaba, ya es el patrón correcto para esta pantalla. Cada
          foto en su propio Reveal (antes: uno solo envolviendo el
          filmstrip completo) para el stagger leve del preset dinámico —
          las clases de layout (ancho/shrink/snap) se mueven al wrapper
          de Reveal, que pasa a ser el ítem flex real. */}
      <div className="mt-10 flex gap-2 overflow-x-auto pb-2 px-4 snap-x snap-mandatory hide-scrollbar md:hidden">
        {images.map((src, i) => (
          <Reveal
            key={src + i}
            delay={100 + Math.min(i, 5) * 60}
            className="shrink-0 w-[78vw] snap-start"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
              className="relative aspect-[4/5] w-full overflow-hidden bg-ink-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset"
            >
              <Image
                src={src}
                alt={`${businessName} - foto ${i + 1}`}
                fill
                sizes="78vw"
                className="object-cover"
              />
            </button>
          </Reveal>
        ))}
      </div>

      {/* Desktop: mosaico editorial con tamaños variables, borde a borde.
          Mismo criterio: el col-span/row-span del patrón de mosaico se
          mueve al wrapper de Reveal, que es el ítem de grid real. */}
      <div className="mt-10 hidden md:grid md:grid-cols-4 md:auto-rows-[180px] md:gap-2 md:grid-flow-dense md:px-8">
        {images.map((src, i) => {
          const featured = FEATURE_PATTERN[i % FEATURE_PATTERN.length];
          return (
            <Reveal
              key={src + i}
              delay={100 + Math.min(i, 5) * 60}
              className={featured ? "md:col-span-2 md:row-span-2" : ""}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="relative w-full h-full overflow-hidden bg-ink-elevated group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset"
              >
                <Image
                  src={src}
                  alt={`${businessName} - foto ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 40vw, 78vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </button>
            </Reveal>
          );
        })}
      </div>

      {openIndex !== null ? (
        <Lightbox
          images={images}
          index={openIndex}
          altPrefix={businessName}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      ) : null}
    </section>
  );
}
