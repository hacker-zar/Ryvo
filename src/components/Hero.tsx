"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Business, TemplateLayoutId } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";

interface HeroProps {
  business: Pick<
    Business,
    | "name"
    | "description"
    | "hero_image"
    | "primary_color"
    | "hero_video"
    | "hero_video_enabled"
    | "hero_video_position"
  >;
  layout?: TemplateLayoutId;
}

export default function Hero({ business, layout }: HeroProps) {
  const { open } = useBookingModal();
  // El <video> se monta recién después del primer render en el cliente
  // (no en el HTML inicial/hidratación) para que el preload scanner del
  // navegador no compita por ancho de banda con la <Image> de acá abajo
  // en el primer pase — la imagen sigue siendo el elemento de LCP exacto
  // de siempre, el video es una mejora progresiva que llega un instante
  // después, nunca antes.
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    // Patrón estándar de "recién montado en el cliente" para excluir el
    // <video> del HTML de hidratación a propósito (ver comentario de
    // `mounted` arriba) — no deriva estado de otro estado, es la
    // excepción reconocida de esta regla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // hero_image es la imagen de respaldo — sin campo separado. Si falla el
  // video (onError) o el usuario prefiere menos movimiento, esta misma
  // <Image>, que ya está debajo, queda como único contenido: no hace
  // falta un request extra ni hay flash de contenido.
  const showVideo =
    mounted &&
    Boolean(business.hero_video_enabled) &&
    Boolean(business.hero_video) &&
    !videoFailed &&
    !prefersReducedMotion;

  const ctaTextColor = readableTextColor(business.primary_color);

  // Capa de imagen/video de fondo, compartida por los layouts full-bleed
  // (Atelier/Noir/Editorial/default) — Studio y Bold NO la usan tal cual
  // (Studio la encierra en un bloque, Bold la recorta), así que queda
  // como pieza reutilizable en vez de duplicar la lógica de video 3 veces.
  // Función simple (no un componente) a propósito: devuelve JSX y se
  // invoca directo como `{backgroundMedia()}`, nunca como `<BackgroundMedia />`
  // — así no dispara la regla react-hooks/static-components, que prohíbe
  // declarar componentes dentro del render (se recrearían en cada
  // renderizado, perdiendo cualquier estado interno que llegaran a tener).
  function backgroundMedia() {
    return business.hero_image ? (
      <div
        className="absolute inset-0"
        data-editable-category="apariencia"
        data-editable-field="hero_video"
      >
        <Image
          src={business.hero_image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {showVideo ? (
          // src directo (no <source> anidado): el archivo subido es
          // siempre uno solo (mp4 o webm, ver adminUploadVideo), y el
          // navegador ya recibe el Content-Type real desde Supabase
          // Storage — declarar un type="video/mp4" fijo acá sería
          // incorrecto para los archivos webm.
          <video
            src={business.hero_video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: business.hero_video_position ?? "center" }}
          />
        ) : null}
        {/* Capa base pareja: garantiza un piso de contraste en TODO el
            hero (clave en mobile, donde el texto ocupa casi el ancho
            completo) sin importar si la foto es clara u oscura. */}
        <div className="absolute inset-0 bg-ink/40" />
        {/* Refuerzo direccional solo desde md: en desktop el texto vive
            en la mitad izquierda, así que ahí conviene más cobertura y
            la foto puede respirar limpia del lado derecho. */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-ink via-ink/55 to-transparent" />
        {/* Asienta el bloque de texto contra el borde inferior en
            cualquier alto de viewport. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </div>
    ) : (
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundColor: business.primary_color }}
      />
    );
  }

  const primaryCta = (
    <button
      type="button"
      onClick={open}
      className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
      style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
    >
      Reservar turno
    </button>
  );

  // === STUDIO — 50/50: texto a la izquierda, imagen contenida a la
  // derecha (no full-bleed) — es la diferencia estructural real pedida. ===
  if (layout === "studio") {
    return (
      <section id="inicio" className="bg-ink">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="section-eyebrow" style={{ color: business.primary_color }}>
              Reservá tu turno online
            </p>
            <h1 className="display-title mt-4 text-3xl sm:text-4xl md:text-5xl text-bone">
              {business.name}
            </h1>
            {business.description ? (
              <p className="mt-5 max-w-md text-bone-muted text-sm md:text-base leading-relaxed line-clamp-3">
                {business.description}
              </p>
            ) : null}
            <div className="mt-8">{primaryCta}</div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-square rounded-sm overflow-hidden bg-ink-elevated">
            {backgroundMedia()}
          </div>
        </div>
      </section>
    );
  }

  // === BOLD — fondo sólido de color accent, foto recortada superpuesta,
  // título enorme. Estructuralmente el más distinto: sin imagen full-bleed. ===
  if (layout === "bold") {
    return (
      <section
        id="inicio"
        className="relative overflow-hidden min-h-[85svh] flex items-center"
        style={{ backgroundColor: business.primary_color }}
      >
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-28 w-full grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="relative z-10">
            <p
              className="section-eyebrow"
              style={{ color: ctaTextColor, opacity: 0.8 }}
            >
              Reservá tu turno online
            </p>
            <h1
              className="display-title mt-3 text-4xl sm:text-5xl md:text-7xl leading-[0.95]"
              style={{ color: ctaTextColor }}
            >
              {business.name}
            </h1>
            {business.description ? (
              <p
                className="mt-5 max-w-md text-sm md:text-base leading-relaxed line-clamp-3"
                style={{ color: ctaTextColor, opacity: 0.85 }}
              >
                {business.description}
              </p>
            ) : null}
            <div className="mt-8">
              <button
                type="button"
                onClick={open}
                className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity bg-ink text-bone"
              >
                Reservar turno
              </button>
            </div>
          </div>
          {business.hero_image ? (
            <div className="relative aspect-[4/5] md:translate-y-6 shadow-2xl rounded-sm overflow-hidden md:rotate-1">
              {backgroundMedia()}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // === Atelier / Noir / Editorial / default — full-bleed, mismo esqueleto
  // de siempre, difieren en tratamiento tipográfico/espaciado del texto. ===
  const isEditorial = layout === "editorial";
  const isAtelier = layout === "atelier";

  return (
    <section
      id="inicio"
      className={`relative overflow-hidden bg-ink flex items-center ${
        isEditorial ? "min-h-[92svh]" : "min-h-[85svh]"
      }`}
    >
      {backgroundMedia()}

      <div
        className={`relative mx-auto max-w-5xl px-4 py-16 md:py-28 w-full ${
          isEditorial ? "flex items-end" : ""
        }`}
      >
        <div
          className={`animate-[fadeIn_0.2s_ease-out] ${
            isEditorial ? "max-w-2xl" : "max-w-xl"
          }`}
        >
          <p className="section-eyebrow" style={{ color: business.primary_color }}>
            Reservá tu turno online
          </p>
          <h1
            className={`display-title mt-4 text-bone [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] ${
              isEditorial
                ? "text-4xl sm:text-5xl md:text-8xl leading-[0.92] uppercase"
                : isAtelier
                  ? "text-3xl sm:text-5xl md:text-7xl"
                  : "text-3xl sm:text-4xl md:text-6xl"
            }`}
          >
            {business.name}
          </h1>
          {business.description ? (
            <p className="mt-5 max-w-md text-bone-muted text-sm md:text-base leading-relaxed line-clamp-3">
              {business.description}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryCta}
            {isAtelier ? (
              <a
                href="#servicios"
                className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold border border-bone/40 text-bone hover:border-bone transition-colors"
              >
                Ver servicios
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
