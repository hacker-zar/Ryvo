"use client";

import Icon from "@/components/ui/Icon";
import { Business } from "@/types/business";

export type WizardStepId = "service" | "professional" | "datetime" | "details";

const STEP_LABELS: Record<WizardStepId, string> = {
  service: "Servicio",
  professional: "Profesional",
  datetime: "Fecha y hora",
  details: "Tus datos",
};

interface StepIndicatorProps {
  steps: WizardStepId[];
  currentStepId: WizardStepId;
  primaryColor: Business["primary_color"];
}

/** La cantidad de pasos ya no es fija — el paso "professional" solo
 *  aparece cuando el servicio elegido tiene 2+ profesionales calificados
 *  (ver BookingModal.tsx) — así que numera dinámicamente en vez de
 *  asumir siempre 3. */
export default function StepIndicator({
  steps,
  currentStepId,
  primaryColor,
}: StepIndicatorProps) {
  const currentIndex = steps.indexOf(currentStepId);
  return (
    // overflow-x-auto (no flex-wrap): con 4 pasos el texto "1 Servicio →
    // 2 Profesional → 3 Fecha y hora → 4 Tus datos" ya no entra en el
    // ancho del modal — sin esto, al ser hijo de un flex sin min-width:0,
    // no se achica y desborda el modal (empuja la X afuera del cuadro).
    // Scrollea horizontal en vez de desbordar, con la misma scrollbar
    // oculta que ya usa el filmstrip de la galería.
    <div className="flex items-center gap-1.5 text-xs min-w-0 overflow-x-auto hide-scrollbar">
      {steps.map((stepId, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div key={stepId} className="flex items-center gap-1.5">
            <span
              className="section-eyebrow whitespace-nowrap transition-colors"
              style={{
                color: isActive || isDone ? primaryColor : "var(--bone-muted)",
              }}
            >
              {i + 1} {STEP_LABELS[stepId]}
            </span>
            {i < steps.length - 1 ? (
              <Icon name="chevron" size={16} rotate={270} className="text-bone-muted/40 shrink-0" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
