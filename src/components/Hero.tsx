"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
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
}

export default function Hero({ business }: HeroProps) {
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

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-ink min-h-[85svh] flex items-center"
    >
      {business.hero_image ? (
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
      )}

      <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-28 w-full">
        <div className="max-w-xl animate-[fadeIn_0.2s_ease-out]">
          <p
            className="section-eyebrow"
            style={{ color: business.primary_color }}
          >
            Reservá tu turno online
          </p>
          <h1 className="display-title mt-4 text-3xl sm:text-4xl md:text-6xl text-bone [text-shadow:0_2px_20px_rgba(0,0,0,0.35)]">
            {business.name}
          </h1>
          {business.description ? (
            <p className="mt-5 max-w-md text-bone-muted text-sm md:text-base leading-relaxed line-clamp-3">
              {business.description}
            </p>
          ) : null}
          <div className="mt-8">
            <button
              type="button"
              onClick={open}
              className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: business.primary_color,
                color: readableTextColor(business.primary_color),
              }}
            >
              Reservar turno
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
