"use client";

import { useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import Lightbox from "@/components/Lightbox";
import GalleryHeader from "./GalleryHeader";

interface ShowcaseGalleryProps {
  images: string[];
  businessName: string;
  primaryColor: Business["primary_color"];
}

/**
 * Variante "Showcase" — una foto protagonista grande con miniaturas
 * debajo; clickear una miniatura cambia la protagonista con un fade
 * suave (reutiliza el keyframe fadeIn ya usado por BookingModal/Lightbox,
 * sin agregar una animación nueva). Clickear la protagonista abre el
 * Lightbox.
 */
export default function ShowcaseGallery({
  images,
  businessName,
  primaryColor,
}: ShowcaseGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="galeria" className="py-16 md:py-24">
      <GalleryHeader primaryColor={primaryColor} />

      <div className="mx-auto mt-10 max-w-4xl px-4">
        <button
          type="button"
          onClick={() => setOpenIndex(activeIndex)}
          aria-label={`Ver foto ${activeIndex + 1} de ${businessName} en tamaño completo`}
          className="image-frame relative block aspect-[16/10] w-full overflow-hidden bg-ink-elevated"
        >
          <Image
            key={activeIndex}
            src={images[activeIndex]}
            alt={`${businessName} - foto ${activeIndex + 1}`}
            fill
            sizes="(min-width: 768px) 60vw, 90vw"
            className="object-cover animate-[fadeIn_0.35s_ease-out]"
          />
        </button>

        {images.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {images.map((src, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Mostrar foto ${i + 1} de ${businessName} como protagonista`}
                  aria-current={isActive}
                  className="image-frame relative h-16 w-16 shrink-0 overflow-hidden bg-ink-elevated sm:h-20 sm:w-20 transition-opacity"
                  style={{
                    outline: isActive ? `2px solid ${primaryColor}` : "1px solid var(--ink-line)",
                    outlineOffset: "-1px",
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {openIndex !== null ? (
        <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      ) : null}
    </section>
  );
}
