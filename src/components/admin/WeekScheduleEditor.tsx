"use client";

import { OpeningHours } from "@/types/business";

interface WeekScheduleEditorProps {
  value: OpeningHours[];
  onChange: (next: OpeningHours[]) => void;
}

const DAYS: { code: OpeningHours["day"]; label: string }[] = [
  { code: "lun", label: "Lunes" },
  { code: "mar", label: "Martes" },
  { code: "mie", label: "Miércoles" },
  { code: "jue", label: "Jueves" },
  { code: "vie", label: "Viernes" },
  { code: "sab", label: "Sábado" },
  { code: "dom", label: "Domingo" },
];

const timeInputClasses =
  "radius-sm border border-ink-line bg-ink-elevated px-2 py-1.5 text-xs text-bone focus:outline-none focus:border-brass transition-colors disabled:opacity-40";

/** Arma la lista completa de 7 días a partir de lo que haya en `value`,
 *  completando con "cerrado" los días que todavía no se cargaron. */
function normalize(value: OpeningHours[]): OpeningHours[] {
  return DAYS.map(({ code }) => {
    const existing = value.find((v) => v.day === code);
    return (
      existing ?? { day: code, open: "09:00", close: "18:00", closed: true }
    );
  });
}

export default function WeekScheduleEditor({
  value,
  onChange,
}: WeekScheduleEditorProps) {
  const days = normalize(value);

  function updateDay(index: number, patch: Partial<OpeningHours>) {
    const next = days.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      {days.map((day, i) => (
        <div
          key={day.day}
          className="flex items-center gap-3 py-1.5 border-b border-ink-line last:border-b-0"
        >
          <label className="flex items-center gap-2 w-24 shrink-0 text-xs text-bone">
            <input
              type="checkbox"
              checked={!day.closed}
              onChange={(e) => updateDay(i, { closed: !e.target.checked })}
            />
            {DAYS[i].label}
          </label>

          {day.closed ? (
            <span className="text-xs text-bone-muted">Cerrado</span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={day.open}
                onChange={(e) => updateDay(i, { open: e.target.value })}
                className={timeInputClasses}
              />
              <span className="text-bone-muted text-xs">a</span>
              <input
                type="time"
                value={day.close}
                onChange={(e) => updateDay(i, { close: e.target.value })}
                className={timeInputClasses}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
