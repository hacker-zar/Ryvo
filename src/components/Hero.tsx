"use client";

import Image from "next/image";
import { Business } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";

interface HeroProps {
  business: Pick<
    Business,
    "name" | "description" | "hero_image" | "primary_color"
  >;
}

export default function Hero({ business }: HeroProps) {
  const { open } = useBookingModal();

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-ink min-h-[85svh] flex items-center"
    >
      {business.hero_image ? (
        <div
          className="absolute inset-0"
          data-editable-category="fotos"
          data-editable-field="hero_image"
        >
          <Image
            src={business.hero_image}
            alt=""
            fill
            priority
            className="object-cover"
          />
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
