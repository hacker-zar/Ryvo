"use client";

import Image from "next/image";
import { Business } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";

interface HeroProps {
  business: Pick<
    Business,
    "name" | "description" | "hero_image" | "primary_color"
  >;
}

export default function Hero({ business }: HeroProps) {
  const { open } = useBookingModal();

  return (
    <section id="inicio" className="relative overflow-hidden bg-ink">
      {business.hero_image ? (
        <div className="absolute inset-0">
          <Image
            src={business.hero_image}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-5xl px-4 py-24 md:py-36 text-center">
        <p
          className="section-eyebrow"
          style={{ color: business.primary_color }}
        >
          Reservá tu turno online
        </p>
        <h1 className="section-title mt-4 text-4xl md:text-6xl text-bone leading-[1.05]">
          {business.name}
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-bone-muted text-sm md:text-base leading-relaxed">
          {business.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={open}
            className="section-eyebrow text-xs px-7 py-3.5 btn-radius text-ink font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: business.primary_color }}
          >
            Reservar turno
          </button>
          <a
            href="#servicios"
            className="section-eyebrow text-xs px-7 py-3.5 btn-radius border border-ink-line text-bone hover:border-brass transition-colors"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}
