"use client";

import { useBookingModal } from "@/lib/booking-modal-context";
import { readableTextColor } from "@/lib/format";
import { Business } from "@/types/business";

interface MobileBookingBarProps {
  business: Pick<Business, "primary_color">;
}

/**
 * Barra de reserva fija, solo mobile: el caso de uso principal es alguien
 * navegando el sitio desde el celular, y el CTA de reservar no debería
 * depender de haber scrolleado hasta el header. Reutiliza el mismo
 * contexto que ya abre el modal desde Header/Hero — no hay lógica de
 * reserva nueva acá, solo otro disparador.
 */
export default function MobileBookingBar({ business }: MobileBookingBarProps) {
  const { open, isOpen } = useBookingModal();

  // El modal ya cubre toda la pantalla cuando está abierto; ocultamos la
  // barra para no dejar un botón interactivo tapado detrás.
  if (isOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink/95 backdrop-blur px-4 pt-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={open}
        className="section-eyebrow w-full text-xs px-6 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: business.primary_color,
          color: readableTextColor(business.primary_color),
        }}
      >
        Reservar turno
      </button>
    </div>
  );
}
