"use client";

import { useState } from "react";
import Image from "next/image";
import { Business, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";

interface EditorialGalleryProps {
  images: string[];
  businessName: string;
  primaryColor: Business["primary_color"];
  layout?: TemplateLayoutId;
}

// Patrones de mosaico por plantilla — mismo mecanismo (col-span/row-span
// sobre una grilla de 3 o 4 columnas), solo cambia el ritmo de repetición
// para que cada plantilla se sienta distinta sin duplicar el componente.
const FEATURE_PATTERNS: Record<string, boolean[]> = {
  default: [true, false, false, true, false, false],
  editorial: [false, false, true, false, true, false],
  bold: [true, false, true, false, false, true],
};

/**
 * Variante "Editorial" — el mosaico asimétrico de siempre (mantenido tal
 * cual estaba antes de existir un selector de variantes de galería, ver
 * GalleryLayoutId), incluyendo sus tres tratamientos según la plantilla
 * del negocio (Noir/Studio/mosaico por patrón). Es el fallback de
 * cualquier negocio sin `gallery_layout` cargado — cero cambio visual
 * para negocios existentes.
 */
export default function EditorialGallery({
  images,
  businessName,
  primaryColor,
  layout,
}: EditorialGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const eyebrowAndTitle = (
    <div data-editable-category="apariencia" data-editable-field="galeria">
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Trabajos
      </p>
      <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">Galería</h2>
    </div>
  );

  // === NOIR — foto grande, una o dos columnas, hover marcado: la galería
  // como pieza cinematográfica, no como grilla de miniaturas. ===
  if (layout === "noir") {
    return (
      <section id="galeria" className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>{eyebrowAndTitle}</Reveal>
        </div>
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 px-4 snap-x snap-mandatory hide-scrollbar md:hidden">
          {images.map((src, i) => (
            <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60} className="shrink-0 w-[85vw] snap-start">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="image-frame relative aspect-[4/5] w-full overflow-hidden bg-ink-elevated"
              >
                <Image src={src} alt={`${businessName} - foto ${i + 1}`} fill sizes="85vw" className="object-cover" />
              </button>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 hidden md:grid md:grid-cols-2 md:gap-3 md:px-8">
          {images.map((src, i) => (
            <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="image-frame relative aspect-[4/5] w-full overflow-hidden bg-ink-elevated group"
              >
                <Image
                  src={src}
                  alt={`${businessName} - foto ${i + 1}`}
                  fill
                  sizes="45vw"
                  className="object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/0 transition-colors duration-500" />
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

  // === STUDIO — grilla pareja y limpia (sin mosaico asimétrico). ===
  if (layout === "studio") {
    return (
      <section id="galeria" className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>{eyebrowAndTitle}</Reveal>
        </div>
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 px-4 snap-x snap-mandatory hide-scrollbar md:hidden">
          {images.map((src, i) => (
            <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60} className="shrink-0 w-[78vw] snap-start">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="image-frame relative aspect-square w-full overflow-hidden bg-ink-elevated"
              >
                <Image src={src} alt={`${businessName} - foto ${i + 1}`} fill sizes="78vw" className="object-cover" />
              </button>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 hidden md:grid md:grid-cols-3 md:gap-4 md:px-8">
          {images.map((src, i) => (
            <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="image-frame relative aspect-square w-full overflow-hidden bg-ink-elevated group"
              >
                <Image
                  src={src}
                  alt={`${businessName} - foto ${i + 1}`}
                  fill
                  sizes="30vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
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

  // === Atelier / Editorial / Bold / default — mosaico editorial, mismo
  // mecanismo de siempre con distinto patrón de repetición por plantilla. ===
  const pattern = FEATURE_PATTERNS[layout ?? "default"] ?? FEATURE_PATTERNS.default;

  return (
    <section id="galeria" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>{eyebrowAndTitle}</Reveal>
      </div>

      <div className="mt-10 flex gap-2 overflow-x-auto pb-2 px-4 snap-x snap-mandatory hide-scrollbar md:hidden">
        {images.map((src, i) => (
          <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60} className="shrink-0 w-[78vw] snap-start">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
              className="image-frame relative aspect-[4/5] w-full overflow-hidden bg-ink-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset"
            >
              <Image src={src} alt={`${businessName} - foto ${i + 1}`} fill sizes="78vw" className="object-cover" />
            </button>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 hidden md:grid md:grid-cols-4 md:auto-rows-[180px] md:gap-2 md:grid-flow-dense md:px-8">
        {images.map((src, i) => {
          const featured = pattern[i % pattern.length];
          return (
            <Reveal key={src + i} delay={100 + Math.min(i, 5) * 60} className={featured ? "md:col-span-2 md:row-span-2" : ""}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
                className="image-frame relative w-full h-full overflow-hidden bg-ink-elevated group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset"
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
        <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      ) : null}
    </section>
  );
}
