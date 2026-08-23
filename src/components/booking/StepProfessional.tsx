"use client";

import Icon from "@/components/ui/Icon";
import { useState } from "react";
import { Business, ProfessionalWithServices } from "@/types/business";

interface StepProfessionalProps {
  professionals: ProfessionalWithServices[];
  selectedProfessionalId: string | "any";
  onSelect: (professionalId: string | "any") => void;
  primaryColor: Business["primary_color"];
  stepNumber: number;
}

const PULSE_DURATION_MS = 200;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Solo se muestra cuando el servicio elegido tiene 2+ profesionales
 * calificados (ver BookingModal.tsx) — "Cualquiera disponible" es la
 * opción por defecto porque algunos clientes solo quieren el primer
 * horario libre, y elegir a alguien puntual reduce de verdad los
 * horarios ofrecidos en el paso siguiente (no es un selector cosmético).
 */
export default function StepProfessional({
  professionals,
  selectedProfessionalId,
  onSelect,
  primaryColor,
  stepNumber,
}: StepProfessionalProps) {
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  function handleSelect(id: string | "any") {
    onSelect(id);
    setPulsingId(id);
    window.setTimeout(() => setPulsingId(null), PULSE_DURATION_MS);
  }

  return (
    <div>
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Paso {stepNumber}
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">
        ¿Con quién querés reservar?
      </h3>

      <div className="mt-6 grid gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => handleSelect("any")}
          className={`text-left radius-sm border px-4 py-3.5 transition-colors flex items-center gap-3.5 ${
            pulsingId === "any" ? "select-pulse" : ""
          }`}
          style={{
            borderColor: selectedProfessionalId === "any" ? primaryColor : "var(--ink-line)",
            backgroundColor:
              selectedProfessionalId === "any"
                ? "color-mix(in srgb, var(--brass) 10%, transparent)"
                : "transparent",
          }}
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--brass) 15%, transparent)",
              color: primaryColor,
            }}
          >
            <Icon name="star-filled" size={16} />
          </span>
          <div>
            <p className="text-bone font-medium text-sm">Cualquiera disponible</p>
            <p className="text-xs text-bone-muted mt-0.5">
              Te mostramos el primer horario libre entre todo el equipo.
            </p>
          </div>
        </button>

        {professionals.map((professional) => {
          const selected = professional.id === selectedProfessionalId;
          return (
            <button
              key={professional.id}
              type="button"
              onClick={() => handleSelect(professional.id)}
              className={`text-left radius-sm border px-4 py-3.5 transition-colors flex items-center gap-3.5 ${
                pulsingId === professional.id ? "select-pulse" : ""
              }`}
              style={{
                borderColor: selected ? primaryColor : "var(--ink-line)",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--brass) 10%, transparent)"
                  : "transparent",
              }}
            >
              <span
                aria-hidden
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink-elevated flex items-center justify-center"
              >
                {professional.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={professional.photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="ticket-number text-xs"
                    style={{ color: primaryColor }}
                  >
                    {initials(professional.name)}
                  </span>
                )}
              </span>
              <div>
                <p className="text-bone font-medium text-sm">{professional.name}</p>
                {professional.role ? (
                  <p className="text-xs text-bone-muted mt-0.5">{professional.role}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
