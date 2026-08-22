"use client";

import { useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import Lightbox from "@/components/Lightbox";
import GalleryHeader from "./GalleryHeader";

interface MarqueeGalleryProps {
  images: string[];
  businessName: string;
  primaryColor: Business["primary_color"];
}

// 3 recortes que se van alternando para que la tira no se sienta
// uniforme/genérica (retrato, panorámico, cuadrado) — misma altura fija
// para las tres, el ancho lo define el aspect-ratio (sin medir imágenes
// reales ni JS: cero CLS).
const SHAPES = ["aspect-[3/4]", "aspect-[16/10]", "aspect-square"];

// La tira necesita un mínimo de elementos para que el loop de -50% no se
// sienta corto/entrecortado con pocas fotos — se logra repitiendo las
// MISMAS fotos más veces en el render, nunca duplicando datos en la base
// (business.gallery no cambia). Con muchas fotos, se topea el set único
// que entra en la tira (no todo el catálogo) para no disparar el
// tamaño del DOM/red de una galería con decenas de fotos — es una
// presentación curada y continua, no un listado exhaustivo (para eso
// están Editorial/Masonry).
const MIN_TRACK_ITEMS = 8;
const MAX_UNIQUE_IN_TRACK = 20;
const SECONDS_PER_TRACK_ITEM = 4;
const MIN_DURATION_SECONDS = 20;

/**
 * Variante "Movimiento" — línea horizontal en loop continuo, CSS puro
 * (transform: translateX, mismo mecanismo que Marquee.tsx de las
 * plantillas Noir/Bold: el contenido se duplica exactamente 2 veces y la
 * animación se desplaza -50%, un loop matemáticamente perfecto sin salto
 * visible). Sin JS moviendo nada frame a frame.
 *
 * Desktop: loop automático, se pausa con hover (animation-play-state).
 * Mobile: sin animación — tira horizontal con scroll táctil normal
 * (mismo patrón `overflow-x-auto` que ya usan el resto de las galerías
 * en mobile), porque acá el pedido es "swipe natural", no un loop que
 * compita con el gesto del usuario.
 */
export default function MarqueeGallery({
  images,
  businessName,
  primaryColor,
}: MarqueeGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Con una sola foto, un "loop" solo se vería como la misma imagen
  // deslizándose sobre sí misma — no aporta nada y se siente roto. Se
  // muestra estática en vez de fingir movimiento.
  if (images.length <= 1) {
    return (
      <section id="galeria" className="py-16 md:py-24">
        <GalleryHeader primaryColor={primaryColor} />
        <div className="mt-10 px-4">
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            aria-label={`Ver foto de ${businessName} en tamaño completo`}
            className="relative mx-auto aspect-[16/10] w-full max-w-3xl overflow-hidden rounded-sm bg-ink-elevated block"
          >
            <Image src={images[0]} alt={`${businessName} - foto`} fill sizes="(min-width: 768px) 60vw, 90vw" className="object-cover" />
          </button>
        </div>
        {openIndex !== null ? (
          <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
        ) : null}
      </section>
    );
  }

  const base = images.length > MAX_UNIQUE_IN_TRACK ? images.slice(0, MAX_UNIQUE_IN_TRACK) : images;
  const repeat = Math.max(1, Math.ceil(MIN_TRACK_ITEMS / base.length));
  // sequence.length = repeat * base.length; track = sequence duplicada
  // una vez más (doblado exacto) para que translateX(-50%) sea el punto
  // medio real del contenido — la condición del loop continuo.
  const sequenceLength = repeat * base.length;
  const track = Array.from({ length: sequenceLength * 2 }, (_, i) => base[i % base.length]);
  const durationSeconds = Math.max(MIN_DURATION_SECONDS, sequenceLength * SECONDS_PER_TRACK_ITEM);

  return (
    <section id="galeria" className="py-16 md:py-24">
      <GalleryHeader primaryColor={primaryColor} />

      {/* Mobile: sin animación, scroll horizontal táctil normal. */}
      <div className="mt-10 flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory hide-scrollbar md:hidden">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Ver foto ${i + 1} de ${businessName} en tamaño completo`}
            className={`relative h-64 shrink-0 snap-start overflow-hidden rounded-sm bg-ink-elevated ${SHAPES[i % SHAPES.length]}`}
          >
            <Image src={src} alt={`${businessName} - foto ${i + 1}`} fill sizes="60vw" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop: loop continuo, pausa al hover. Bajo prefers-reduced-motion
          (ver globals.css) la animación se apaga y este mismo contenedor
          pasa a ser scrolleable a mano, para no dejar el resto de las
          fotos inalcanzable. */}
      <div className="gallery-marquee-viewport mt-10 hidden overflow-hidden md:block">
        <div
          className="gallery-marquee-track flex items-stretch gap-3 h-72 lg:h-80"
          style={{ ["--gallery-marquee-duration" as string]: `${durationSeconds}s` }}
        >
          {track.map((src, i) => {
            const isCanonical = i < base.length;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenIndex(i % base.length)}
                aria-hidden={isCanonical ? undefined : true}
                tabIndex={isCanonical ? undefined : -1}
                aria-label={isCanonical ? `Ver foto ${i + 1} de ${businessName} en tamaño completo` : undefined}
                className={`relative h-full shrink-0 overflow-hidden rounded-sm bg-ink-elevated group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset ${SHAPES[i % SHAPES.length]}`}
              >
                <Image
                  src={src}
                  alt={isCanonical ? `${businessName} - foto ${i + 1}` : ""}
                  aria-hidden={isCanonical ? undefined : true}
                  fill
                  sizes="30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      </div>

      {openIndex !== null ? (
        <Lightbox images={images} index={openIndex} altPrefix={businessName} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      ) : null}
    </section>
  );
}
