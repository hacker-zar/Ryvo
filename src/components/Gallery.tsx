import Image from "next/image";
import { Business } from "@/types/business";

interface GalleryProps {
  images: NonNullable<Business["gallery"]>;
  businessName: string;
  primaryColor: Business["primary_color"];
}

export default function Gallery({
  images,
  businessName,
  primaryColor,
}: GalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <section id="galeria" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          Trabajos
        </p>
        <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
          Galería
        </h2>
      </div>

      {/* Filmstrip horizontal, borde a borde: la foto es la protagonista,
          sin gaps grandes ni bordes redondeados que la recorten en
          cuadraditos. En mobile cada imagen ocupa ~78% del ancho de
          pantalla (se ve 1 imagen completa + un adelanto de la
          siguiente), para que quede obvio que se puede seguir
          deslizando en vez de leerse como una fila de miniaturas. */}
      <div className="mt-10 flex gap-2 overflow-x-auto pb-2 px-4 md:px-8 snap-x snap-mandatory hide-scrollbar">
        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative aspect-[4/5] w-[78vw] sm:w-72 md:w-80 shrink-0 overflow-hidden bg-ink-elevated snap-start"
          >
            <Image
              src={src}
              alt={`${businessName} - foto ${i + 1}`}
              fill
              sizes="(max-width: 640px) 78vw, 320px"
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
