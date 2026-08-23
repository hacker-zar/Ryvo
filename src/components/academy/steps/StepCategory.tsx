"use client";

import { useState } from "react";
import { AcademyCategoryWithRelations, Business } from "@/types/business";
import { dayLabel } from "@/lib/format";

interface StepCategoryProps {
  categories: AcademyCategoryWithRelations[];
  selectedCategoryId: string | null;
  onSelect: (category: AcademyCategoryWithRelations) => void;
  primaryColor: Business["primary_color"];
  /** true si ya vino preseleccionada desde "Me interesa" en una card
   *  puntual — se muestra como resumen de solo lectura en vez de picker
   *  (pedido explícito: "mostrar la categoría que eligió"). */
  preselected: boolean;
}

function scheduleLine(category: AcademyCategoryWithRelations): string {
  const days = category.days.map((d) => dayLabel(d)).join(" y ");
  return [days, category.schedule_time].filter(Boolean).join(" — ");
}

export default function StepCategory({
  categories,
  selectedCategoryId,
  onSelect,
  primaryColor,
  preselected,
}: StepCategoryProps) {
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const selected = categories.find((c) => c.id === selectedCategoryId) ?? null;

  function handleSelect(category: AcademyCategoryWithRelations) {
    onSelect(category);
    setPulsingId(category.id);
    window.setTimeout(() => setPulsingId(null), 200);
  }

  if (preselected && selected) {
    return (
      <div>
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          Paso 1
        </p>
        <h3 className="section-title mt-1 text-xl text-bone">{selected.name}</h3>
        <div className="mt-4 radius-sm border border-ink-line bg-ink-elevated p-4 grid gap-1.5 text-sm">
          {selected.age_level ? <p className="text-bone-muted">{selected.age_level}</p> : null}
          {scheduleLine(selected) ? (
            <p className="text-bone">{scheduleLine(selected)}</p>
          ) : null}
          {selected.location_name ? (
            <p className="text-bone-muted">Sede: {selected.location_name}</p>
          ) : null}
          {selected.instructor_name ? (
            <p className="text-bone-muted">Profesor: {selected.instructor_name}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Paso 1
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Elegí una categoría</h3>

      <div className="mt-4 grid gap-2.5">
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelect(category)}
              className={`text-left radius-sm border p-4 transition-colors ${
                pulsingId === category.id ? "select-pulse" : ""
              }`}
              style={{
                borderColor: isSelected ? primaryColor : "var(--ink-line)",
                backgroundColor: isSelected
                  ? "color-mix(in srgb, var(--brass) 10%, transparent)"
                  : undefined,
              }}
            >
              <p className="text-bone font-medium">{category.name}</p>
              {category.age_level ? (
                <p className="text-xs text-bone-muted mt-0.5">{category.age_level}</p>
              ) : null}
              {scheduleLine(category) ? (
                <p className="text-xs text-bone-muted mt-1">{scheduleLine(category)}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
