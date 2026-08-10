"use client";

import { Business } from "@/types/business";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  primaryColor: Business["primary_color"];
}

const STEPS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Fecha y hora" },
  { n: 3, label: "Tus datos" },
];

export default function StepIndicator({
  currentStep,
  primaryColor,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {STEPS.map((step, i) => {
        const isActive = step.n === currentStep;
        const isDone = step.n < currentStep;
        return (
          <div key={step.n} className="flex items-center gap-1.5">
            <span
              className="section-eyebrow whitespace-nowrap transition-colors"
              style={{
                color: isActive || isDone ? primaryColor : "var(--bone-muted)",
              }}
            >
              {step.n} {step.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="text-bone-muted/40">→</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
