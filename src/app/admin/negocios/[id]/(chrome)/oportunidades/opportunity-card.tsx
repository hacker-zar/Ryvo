"use client";

import { useState } from "react";
import { Opportunity } from "@/types/business";
import { daysAgoLabel } from "@/lib/format";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

/** Acordeón — mismo patrón de interacción que category-panel.tsx del
 *  editor. Cada tarjeta se abre para ver los clientes/turnos detrás del
 *  número, tal como lo pidió el usuario. */
export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [open, setOpen] = useState(false);
  const hasClients = (opportunity.clients?.length ?? 0) > 0;
  const hasSlots = (opportunity.slots?.length ?? 0) > 0;
  const hasDetail = hasClients || hasSlots;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left disabled:cursor-default"
        disabled={!hasDetail}
      >
        <span className="text-sm text-bone">{opportunity.title}</span>
        {hasDetail ? (
          <span className="text-bone-muted text-xs" aria-hidden="true">
            {open ? "▼" : "▶"}
          </span>
        ) : null}
      </button>

      {open && hasClients ? (
        <div className="pb-6 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-bone-muted border-b border-ink-line">
                <th className="py-2 pr-4 font-normal">Nombre</th>
                <th className="py-2 pr-4 font-normal">Última visita</th>
                <th className="py-2 pr-4 font-normal">Servicio</th>
                <th className="py-2 pr-4 font-normal">Días</th>
                <th className="py-2 pr-4 font-normal">Frecuencia</th>
                <th className="py-2 font-normal">Estado</th>
              </tr>
            </thead>
            <tbody>
              {opportunity.clients!.map((row, i) => (
                <tr
                  key={`${row.client_id}-${i}`}
                  className="border-b border-ink-line/50 last:border-b-0"
                >
                  <td className="py-2 pr-4 text-bone">{row.client_name}</td>
                  <td className="py-2 pr-4 text-bone-muted">
                    {row.last_visit ? daysAgoLabel(row.last_visit) : "—"}
                  </td>
                  <td className="py-2 pr-4 text-bone-muted">
                    {row.service_name ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-bone-muted">
                    {row.days_since_last_visit ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-bone-muted">
                    {row.usual_frequency_days
                      ? `cada ${row.usual_frequency_days} días`
                      : "—"}
                  </td>
                  <td className="py-2 text-bone-muted">
                    {row.status ? STATUS_LABELS[row.status] : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {open && hasSlots ? (
        <div className="pb-6 grid gap-2">
          {opportunity.slots!.map((slot, i) => (
            <div
              key={`${slot.location_name}-${i}`}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-bone">
                {slot.day_label} · {slot.location_name}
              </span>
              <span className="ticket-number text-bone-muted">
                {Math.round(slot.occupancy_rate * 100)}% ocupado
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
