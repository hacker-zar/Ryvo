"use client";

import { useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import Lightbox from "@/components/Lightbox";
import GalleryHeader from "./GalleryHeader";

interface FilmstripGalleryProps {
  images: string[];
  businessName: string;
  primaryColor: Business["primary_color"];
}

/**
 * Variante "Filmstrip" — tira horizontal navegable donde una foto es la
 * "activa" (más grande, sin atenuar) y el resto queda más chico y algo
 * apagado alrededor — más editorial que un carrusel de miniaturas
 * parejas. Navegación con flechas + clickeando cualquier miniatura;
 * clickear la activa abre el Lightbox. Sin animación continua (a
 * diferencia de "Movimiento") — el movimiento acá lo decide el usuario.
 */
export default function FilmstripGallery({
  images,
  businessName,
  primaryColor,
}: FilmstripGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function goTo(i: number) {
    setActiveIndex(((i % images.length) + images.length) % images.length);
  }

  return (
    <section id="galeria" className="py-16 md:py-24">
      <GalleryHeader primaryColor={primaryColor} />

      <div className="mt-10 px-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {images.length > 1 ? (
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className="hidden shrink-0 h-10 w-10 rounded-full border border-ink-line text-bone-muted hover:border-brass hover:text-brass transition-colors sm:flex items-center justify-center"
            >
              ‹
            </button>
          ) : null}

          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
            {images.map((src, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => (isActive ? setOpenIndex(i) : goTo(i))}
                  aria-label={
                    isActive
                      ? `Ver foto ${i + 1} de ${businessName} en tamaño completo`
                      : `Mostrar foto ${i + 1} de ${businessName} como protagonista`
                  }
                  className={`relative shrink-0 snap-center overflow-hidden rounded-sm bg-ink-elevated transition-all duration-500 ${
                    isActive
                      ? "h-64 sm:h-80 aspect-[4/5] ring-2 ring-inset"
                      : "h-40 sm:h-48 aspect-[3/4] opacity-60 hover:opacity-90"
                  }`}
                  style={isActive ? ({ "--tw-ring-color": primaryColor } as React.CSSProperties) : undefined}
                >
                  <Image
                    src={src}
                    alt={`${businessName} - foto ${i + 1}`}
                    fill
                    sizes={isActive ? "(min-width: 640px) 40vw, 70vw" : "(min-width: 640px) 20vw, 40vw"}
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Foto siguiente"
              className="hidden shrink-0 h-10 w-10 rounded-full border border-ink-line text-bone-muted hover:border-brass hover:text-brass transition-colors sm:flex items-center justify-center"
            >
              ›
            </button>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-4 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la foto ${i + 1}`}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: i === activeIndex ? primaryColor : "var(--ink-line)",
                  width: i === activeIndex ? "1.25rem" : "0.375rem",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {openIndex !== null ? (
        <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      ) : null}
    </section>
  );
}
