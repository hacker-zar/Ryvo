"use client";

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
    <div className="flex items-center gap-1.5 text-xs">
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
              <span className="text-bone-muted/40">→</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
