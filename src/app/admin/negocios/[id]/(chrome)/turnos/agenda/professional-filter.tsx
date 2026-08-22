"use client";

import { ProfessionalWithServices } from "@/types/business";

interface ProfessionalFilterProps {
  professionals: ProfessionalWithServices[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** [Todos] + un chip por profesional activo — "Todos" muestra columnas
 *  para todos; elegir uno acota la Agenda a ese profesional solo. Mismo
 *  patrón visual de chips que ya usa el resto del admin (ver
 *  two-column-layout.tsx). */
export default function ProfessionalFilter({
  professionals,
  selectedId,
  onSelect,
}: ProfessionalFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border shrink-0 transition-colors"
        style={{
          borderColor: selectedId === "all" ? "var(--brass)" : "var(--ink-line)",
          color: selectedId === "all" ? "var(--brass)" : "var(--bone-muted)",
        }}
      >
        Todos
      </button>
      {professionals.map((professional) => (
        <button
          key={professional.id}
          type="button"
          onClick={() => onSelect(professional.id)}
          className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border shrink-0 transition-colors"
          style={{
            borderColor:
              selectedId === professional.id ? "var(--brass)" : "var(--ink-line)",
            color:
              selectedId === professional.id ? "var(--brass)" : "var(--bone-muted)",
          }}
        >
          {professional.name}
        </button>
      ))}
    </div>
  );
}
