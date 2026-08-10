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
    <section id="galeria" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Trabajos
      </p>
      <h2 className="section-title mt-2 text-2xl md:text-4xl text-bone">
        Galería
      </h2>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative aspect-square overflow-hidden bg-ink-elevated"
          >
            <Image
              src={src}
              alt={`${businessName} - foto ${i + 1}`}
              fill
              className="object-cover grayscale-[30%] hover:grayscale-0 hover:scale-105 transition-all duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
