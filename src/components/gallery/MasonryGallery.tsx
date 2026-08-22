"use client";

import { useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";
import GalleryHeader from "./GalleryHeader";

interface MasonryGalleryProps {
  images: string[];
  businessName: string;
  primaryColor: Business["primary_color"];
}

// El modelo actual solo guarda URLs (sin ancho/alto reales, ver
// Business.gallery) — en vez de medir cada imagen en el cliente (JS +
// reflow + posible CLS mientras cargan), se les asigna una proporción
// distinta de forma determinística por posición. Se repite cada 5 fotos,
// con una ligera variación de alto dentro de la misma proporción para
// que la trama no se sienta mecánica.
const SHAPES = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[5/4]", "aspect-[3/5]"];

/**
 * Variante "Masonry" — columnas tipo mampostería (CSS `columns`, sin
 * medir imágenes ni JS de layout: cada tarjeta declara su aspect-ratio
 * de antemano, así el navegador arma las columnas sin reflow ni CLS).
 * Responsive vía el número de columnas, no vía un recálculo en JS.
 */
export default function MasonryGallery({
  images,
  businessName,
  primaryColor,
}: MasonryGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="galeria" className="py-16 md:py-24">
      <GalleryHeader primaryColor={primaryColor} />

      <div className="mt-10 px-4 columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {images.map((src, i) => (
          <Reveal key={src + i} delay={100 + Math.min(i, 8) * 40} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
              className={`relative block w-full overflow-hidden rounded-sm bg-ink-elevated group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset ${SHAPES[i % SHAPES.length]}`}
            >
              <Image
                src={src}
                alt={`${businessName} - foto ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </Reveal>
        ))}
      </div>

      {openIndex !== null ? (
        <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      ) : null}
    </section>
  );
}
