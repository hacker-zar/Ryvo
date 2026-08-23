"use client";

import { BookingWithDetails } from "@/lib/data/business-repository";
import { ProfessionalWithServices } from "@/types/business";
import { addDaysToDateString } from "@/lib/agenda";

interface AgendaWeekProps {
  bookings: BookingWithDetails[];
  professionals: ProfessionalWithServices[];
  /** Lunes de la semana a mostrar. */
  weekStartDate: string;
  onSelectDay: (date: string) => void;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Vista Semana — pensada para entender CARGA de trabajo de un vistazo,
 * no para gestionar turno por turno (esa sigue siendo la vista Día,
 * prioridad V1 según el pedido). Una fila por profesional, una columna
 * por día, una barra proporcional a la cantidad de turnos activos (sin
 * contar cancelados). Solo el encabezado de cada día es clickeable —
 * lleva a la vista Día de esa fecha.
 */
export default function AgendaWeek({
  bookings,
  professionals,
  weekStartDate,
  onSelectDay,
}: AgendaWeekProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysToDateString(weekStartDate, i));
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const rows =
    professionals.length > 0
      ? professionals.map((p) => ({ id: p.id, name: p.name }))
      : [{ id: null, name: "Turnos" }];

  function countFor(rowId: string | null, date: string): number {
    return activeBookings.filter(
      (b) => b.date === date && (rowId === null || b.professional_id === rowId)
    ).length;
  }

  const maxCount = Math.max(
    1,
    ...rows.flatMap((row) => days.map((d) => countFor(row.id, d)))
  );

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <table className="w-full border-collapse min-w-[560px]">
        <thead>
          <tr>
            <th className="text-left text-xs text-bone-muted font-normal pb-3 pr-3 w-32">
              Profesional
            </th>
            {days.map((date, i) => (
              <th key={date} className="pb-3 px-1">
                <button
                  type="button"
                  onClick={() => onSelectDay(date)}
                  className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
                >
                  {DAY_LABELS[i]}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? "none"} className="border-t border-ink-line">
              <td className="text-sm text-bone py-3 pr-3 truncate">{row.name}</td>
              {days.map((date) => {
                const count = countFor(row.id, date);
                const heightPct = count === 0 ? 0 : Math.max(15, (count / maxCount) * 100);
                return (
                  <td key={date} className="px-1 py-3">
                    <div className="h-10 flex items-end justify-center">
                      {count > 0 ? (
                        <div
                          className="w-full radius-sm bg-ink-elevated border border-ink-line flex items-start justify-center"
                          style={{ height: `${heightPct}%`, backgroundColor: "var(--brass)", opacity: 0.25 + Math.min(count / maxCount, 1) * 0.55 }}
                        >
                          <span className="ticket-number text-[10px] text-bone mt-0.5">
                            {count}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-bone-muted/40">–</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
