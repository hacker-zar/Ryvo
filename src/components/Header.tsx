"use client";

import Image from "next/image";
import { Business, SectionId } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";

interface HeaderProps {
  business: Pick<Business, "name" | "logo" | "primary_color" | "slug">;
  /** Secciones activas (ver section_order) — un link cuya sección fue
   *  desactivada se oculta acá para no dejar un ancla muerta. No se
   *  agregan links nuevos para secciones que hoy no tienen uno
   *  (Profesionales, Sobre nosotros) — decisión explícita, ver plan. */
  enabledSectionIds: SectionId[];
}

const NAV_LINKS: { href: string; label: string; section: SectionId }[] = [
  { href: "#servicios", label: "Servicios", section: "services" },
  { href: "#galeria", label: "Galería", section: "gallery" },
  { href: "#resenas", label: "Reseñas", section: "reviews" },
  { href: "#contacto", label: "Contacto", section: "contact" },
];

export default function Header({ business, enabledSectionIds }: HeaderProps) {
  const { open } = useBookingModal();
  const visibleNavLinks = NAV_LINKS.filter((link) =>
    enabledSectionIds.includes(link.section)
  );

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
              data-editable-category="apariencia"
              data-editable-field="logo"
              className="rounded-full object-cover ring-1 ring-ink-line"
            />
          ) : null}
          <span
            data-editable-category="pagina"
            data-editable-field="nombre"
            className="section-title text-sm text-bone truncate"
          >
            {business.name}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-xs">
          {visibleNavLinks.map((link) => (
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
