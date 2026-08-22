import Image from "next/image";
import Reveal from "@/components/Reveal";

// Grid de fotos + CTA a Instagram — exclusiva de la plantilla Bold.
// Reutiliza la galería ya cargada (hasta 6 fotos) e `instagram` (ya
// existente en Business) — sin campos ni tablas nuevas. No se muestra
// si no hay ni fotos ni instagram cargado.
interface SocialGridProps {
  images: string[];
  instagram: string;
  accentColor: string;
  businessName: string;
}

export default function SocialGrid({
  images,
  instagram,
  accentColor,
  businessName,
}: SocialGridProps) {
  if (images.length === 0 && !instagram) return null;
  const shown = images.slice(0, 6);
  const handle = instagram.replace(/^@/, "");

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="section-eyebrow" style={{ color: accentColor }}>
            Seguinos
          </p>
          <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
            En Instagram
          </h2>
        </div>
        {handle ? (
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="section-eyebrow text-xs px-5 py-3 rounded-full font-semibold shrink-0 w-fit hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accentColor, color: "var(--ink)" }}
          >
            @{handle} →
          </a>
        ) : null}
      </Reveal>

      {shown.length > 0 ? (
        <Reveal
          delay={100}
          className="mt-8 grid grid-cols-3 gap-2 md:gap-3"
        >
          {shown.map((src, i) => (
            <div
              key={src + i}
              className="image-frame relative aspect-square overflow-hidden bg-ink-elevated group"
            >
              <Image
                src={src}
                alt={`${businessName} en Instagram - foto ${i + 1}`}
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </Reveal>
      ) : null}
    </section>
  );
}
