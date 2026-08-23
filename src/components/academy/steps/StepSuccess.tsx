"use client";

import { Business } from "@/types/business";
import { readableTextColor, whatsappLink } from "@/lib/format";

interface StepSuccessProps {
  business: Pick<Business, "name" | "primary_color" | "whatsapp">;
  /** Vacío = usa business.whatsapp como fallback (ver Academy.contact_phone). */
  contactPhone: string;
  categoryName: string;
  onClose: () => void;
}

// Sin "Agregar al calendario" ni "Gestionar mi turno" (a diferencia del
// StepSuccess de turnos) — no aplican a una solicitud de interés, no a
// un turno con fecha/hora concreta.
export default function StepSuccess({
  business,
  contactPhone,
  categoryName,
  onClose,
}: StepSuccessProps) {
  const whatsapp = contactPhone || business.whatsapp;

  return (
    <div className="text-center py-6">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brass) 18%, transparent)",
          color: business.primary_color,
        }}
      >
        ✓
      </div>

      <h3 className="section-title mt-5 text-xl text-bone">¡Solicitud enviada!</h3>

      <div className="mt-6 grid gap-1 text-sm">
        <p className="text-bone-muted">Recibimos tu interés en la Academia.</p>
        <p className="text-bone font-medium">{categoryName}</p>
        <p className="text-bone-muted">
          El equipo se va a poner en contacto con vos para continuar con la
          inscripción.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 max-w-xs mx-auto">
        {whatsapp ? (
          <a
            href={whatsappLink(
              whatsapp,
              `Hola! Quiero más info sobre la Academia (${categoryName}).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="section-eyebrow radius-sm border border-ink-line px-5 py-3 text-xs text-bone hover:border-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Contactar por WhatsApp
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="section-eyebrow mt-6 radius-sm font-semibold text-xs px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-opacity"
        style={{
          backgroundColor: business.primary_color,
          color: readableTextColor(business.primary_color),
        }}
      >
        Cerrar
      </button>
    </div>
  );
}
