"use client";

import { AcademyCategoryWithRelations, Business } from "@/types/business";
import { dayLabel } from "@/lib/format";

interface StepConfirmProps {
  category: AcademyCategoryWithRelations;
  name: string;
  phone: string;
  primaryColor: Business["primary_color"];
}

/** Paso pedido explícitamente (turnos no lo tiene — confirma en el mismo
 *  paso de datos): resumen de solo lectura antes de enviar. Los botones
 *  "Enviar solicitud"/"Volver" viven en el footer del modal, igual que
 *  el resto de los pasos. */
export default function StepConfirm({ category, name, phone, primaryColor }: StepConfirmProps) {
  const days = category.days.map((d) => dayLabel(d)).join(" y ");

  return (
    <div>
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Paso 3
      </p>
      <h3 className="section-title mt-1 text-xl text-bone">Solicitud de inscripción</h3>

      <div className="mt-6 radius-sm border border-ink-line bg-ink-elevated p-4">
        <dl className="grid gap-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-bone-muted">Categoría</dt>
            <dd className="text-bone text-right">{category.name}</dd>
          </div>
          {days || category.schedule_time ? (
            <div className="flex justify-between gap-4">
              <dt className="text-bone-muted">Horarios</dt>
              <dd className="text-bone text-right">
                {[days, category.schedule_time].filter(Boolean).join(" — ")}
              </dd>
            </div>
          ) : null}
          {category.location_name ? (
            <div className="flex justify-between gap-4">
              <dt className="text-bone-muted">Sede</dt>
              <dd className="text-bone text-right">{category.location_name}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-ink-line">
            <dt className="text-bone-muted">Nombre</dt>
            <dd className="text-bone text-right">{name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-bone-muted">Teléfono</dt>
            <dd className="ticket-number text-bone text-right">{phone}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
