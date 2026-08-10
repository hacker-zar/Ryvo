"use client";

import { Business, Service } from "@/types/business";
import { formatDuration, formatPrice } from "@/lib/format";

interface StepServiceProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
  primaryColor: Business["primary_color"];
}

export default function StepService({
  services,
  selectedServiceId,
  onSelect,
  primaryColor,
}: StepServiceProps) {
  return (
    <div>
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Paso 1
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">
        Elegí un servicio
      </h3>

      <div className="mt-6 grid gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
        {services.map((service) => {
          const selected = service.id === selectedServiceId;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className="text-left rounded-sm border px-4 py-3.5 transition-colors flex items-center justify-between gap-4"
              style={{
                borderColor: selected ? primaryColor : "var(--ink-line)",
                backgroundColor: selected
                  ? "color-mix(in srgb, var(--brass) 10%, transparent)"
                  : "transparent",
              }}
            >
              <div>
                <p className="text-bone font-medium text-sm">
                  {service.name}
                </p>
                <p className="text-xs text-bone-muted mt-0.5">
                  {formatDuration(service.duration)}
                </p>
              </div>
              <span
                className="ticket-number text-sm shrink-0"
                style={{ color: primaryColor }}
              >
                {formatPrice(service.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
