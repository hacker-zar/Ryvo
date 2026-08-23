"use client";

import Image from "next/image";
import { Business, SectionId, TemplateLayoutId } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";

interface HeaderProps {
  business: Pick<Business, "name" | "logo" | "primary_color" | "slug">;
  /** Secciones activas (ver section_order) — un link cuya sección fue
   *  desactivada se oculta acá para no dejar un ancla muerta. No se
   *  agregan links nuevos para secciones que hoy no tienen uno
   *  (Profesionales, Sobre nosotros) — decisión explícita, ver plan. */
  enabledSectionIds: SectionId[];
  layout?: TemplateLayoutId;
}

/**
 * Toda sección reordenable que tenga un ancla real en el sitio público.
 * "about" queda afuera porque su <section> no lleva `id` (ver About.tsx),
 * así que no hay a dónde saltar — no se inventa uno acá.
 *
 * Antes esta lista cubría solo 4 de las 6 secciones enlazables:
 * Profesionales y Catálogo podían estar activos y no tener entrada en el
 * menú. Ahora la usan tanto el nav de escritorio como el de mobile, así
 * que las dos navegaciones no pueden volver a desincronizarse.
 */
const NAV_LINKS: { href: string; label: string; section: SectionId }[] = [
  { href: "#servicios", label: "Servicios", section: "services" },
  { href: "#catalogo", label: "Catálogo", section: "products" },
  { href: "#profesionales", label: "Profesionales", section: "professionals" },
  { href: "#galeria", label: "Galería", section: "gallery" },
  { href: "#resenas", label: "Reseñas", section: "reviews" },
  { href: "#contacto", label: "Contacto", section: "contact" },
];

export default function Header({ business, enabledSectionIds, layout }: HeaderProps) {
  const { open } = useBookingModal();
  const visibleNavLinks = NAV_LINKS.filter((link) =>
    enabledSectionIds.includes(link.section)
  );

  // Noir/Bold: nav de mayor contraste — tracking más ancho, borde inferior
  // en el color de acento en vez del filete neutro de siempre. El resto
  // (tipografía del nombre, tamaño) ya varía solo por AppearanceScope
  // (--font-display-stack cambia por plantilla), así que acá solo se
  // ajusta lo que ese mecanismo no cubre: el borde y el tracking del nav.
  const boldBorder = layout === "noir" || layout === "bold";

  return (
    <header
      className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b"
      style={{ borderColor: boldBorder ? business.primary_color : "var(--ink-line)" }}
    >
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

        <nav className={`hidden md:flex items-center gap-7 text-xs ${boldBorder ? "tracking-widest" : ""}`}>
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

        {/* Oculto en mobile a propósito: ahí ya está MobileBookingBar (CTA
            fijo abajo de todo) — mostrar también este de acá arriba
            dejaba 3 botones de reservar visibles a la vez (este + el del
            Hero + el fijo). En desktop no existe esa barra fija, así que
            acá sigue siendo el único CTA persistente. */}
        <button
          type="button"
          onClick={open}
          className="hidden md:inline-flex section-eyebrow text-xs font-semibold px-4 py-2 btn-radius hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: business.primary_color,
            color: readableTextColor(business.primary_color),
          }}
        >
          Reservar
        </button>
      </div>

      {/* Navegación mobile.
          Hasta acá, en celular el header era solo logo + nombre: el <nav>
          de arriba es `hidden md:flex` y el CTA `hidden md:inline-flex`,
          así que no había NINGUNA forma de llegar a una sección sin
          scrollear el sitio entero — justo en el dispositivo donde ocurre
          el caso de uso principal (alguien con el QR frente al local).

          Tira horizontal en vez de menú hamburguesa: son 6 destinos como
          máximo, un hamburger agregaría un tap y una capa modal para algo
          que entra en una fila. El desborde lateral es su propia
          afordancia — el `pr-8` final deja que se asome un pedazo del
          último chip en vez de cortarlo al ras, que es lo que le dice al
          usuario que hay más.

          No compite con MobileBookingBar: aquélla vive fija abajo, ésta
          arriba, y ninguna de las dos es un CTA de reserva duplicado. */}
      {visibleNavLinks.length > 0 ? (
        <nav
          aria-label="Secciones"
          className="md:hidden border-t border-ink-line/60 overflow-x-auto hide-scrollbar"
        >
          <div className="flex items-stretch gap-1 px-2 pr-8 w-max">
            <a
              href="#inicio"
              className="section-eyebrow text-[11px] text-bone-muted hover:text-brass transition-colors px-3 min-h-11 flex items-center whitespace-nowrap"
            >
              Inicio
            </a>
            {visibleNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="section-eyebrow text-[11px] text-bone-muted hover:text-brass transition-colors px-3 min-h-11 flex items-center whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
