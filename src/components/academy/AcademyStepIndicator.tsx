"use client";

import Icon from "@/components/ui/Icon";
import { Business } from "@/types/business";

export type AcademyStepId = "category" | "details" | "confirm";

const STEP_LABELS: Record<AcademyStepId, string> = {
  category: "Categoría",
  details: "Tus datos",
  confirm: "Confirmación",
};

const STEPS: AcademyStepId[] = ["category", "details", "confirm"];

interface AcademyStepIndicatorProps {
  currentStepId: AcademyStepId;
  primaryColor: Business["primary_color"];
}

/** Mismo componente visual que StepIndicator.tsx (turnos) — no se
 *  reutiliza ese directo porque está tipado contra WizardStepId
 *  (specífico de turnos); acá los pasos son siempre los mismos 3, sin
 *  el largo dinámico que sí tiene el de turnos. */
export default function AcademyStepIndicator({
  currentStepId,
  primaryColor,
}: AcademyStepIndicatorProps) {
  const currentIndex = STEPS.indexOf(currentStepId);
  return (
    <div className="flex items-center gap-1.5 text-xs min-w-0 overflow-x-auto hide-scrollbar">
      {STEPS.map((stepId, i) => {
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
            {i < STEPS.length - 1 ? (
              <Icon name="chevron" size={16} rotate={270} className="text-bone-muted/40 shrink-0" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
