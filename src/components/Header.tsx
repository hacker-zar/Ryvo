"use client";

import Image from "next/image";
import { Business } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";

interface HeaderProps {
  business: Pick<Business, "name" | "logo" | "primary_color" | "slug">;
}

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#resenas", label: "Reseñas" },
  { href: "#contacto", label: "Contacto" },
];

export default function Header({ business }: HeaderProps) {
  const { open } = useBookingModal();

  return (
    <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b border-ink-line">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-3 min-w-0">
          {business.logo ? (
            <Image
              src={business.logo}
              alt={business.name}
              width={32}
              height={32}
              className="rounded-full object-cover ring-1 ring-ink-line"
            />
          ) : null}
          <span className="section-title text-sm text-bone truncate">
            {business.name}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-xs">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="section-eyebrow text-bone-muted hover:text-brass transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={open}
          className="section-eyebrow text-xs font-semibold px-4 py-2 btn-radius hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: business.primary_color,
            color: readableTextColor(business.primary_color),
          }}
        >
          Reservar
        </button>
      </div>
    </header>
  );
}
