"use client";

import { useState } from "react";
import { dayCodeForDate } from "@/lib/availability";
import { OpeningHours } from "@/types/business";

interface MiniCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  openingHours: OpeningHours[];
  primaryColor: string;
  /** No se permite navegar a meses anteriores al actual. */
  minDate?: Date;
}

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isBeforeDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() &&
      (a.getMonth() < b.getMonth() ||
        (a.getMonth() === b.getMonth() && a.getDate() < b.getDate())))
  );
}

export default function MiniCalendar({
  selectedDate,
  onSelectDate,
  openingHours,
  primaryColor,
  minDate,
}: MiniCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const floor = minDate ?? today;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pulsingDate, setPulsingDate] = useState<string | null>(null);

  function handleSelectDate(iso: string) {
    onSelectDate(iso);
    setPulsingDate(iso);
    window.setTimeout(() => setPulsingDate(null), 200);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0 = domingo

  const canGoPrev =
    viewYear > floor.getFullYear() ||
    (viewYear === floor.getFullYear() && viewMonth > floor.getMonth());

  function goPrevMonth() {
    if (!canGoPrev) return;
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  }

  function goNextMonth() {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewYear, viewMonth, day));
  }

  function isDayClosed(date: Date): boolean {
    const code = dayCodeForDate(toISODate(date));
    const config = openingHours.find((oh) => oh.day === code);
    return !config || config.closed || !config.open || !config.close;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="h-7 w-7 rounded-sm border border-ink-line text-bone-muted flex items-center justify-center text-sm disabled:opacity-30 hover:border-brass hover:text-bone transition-colors"
        >
          ‹
        </button>
        <span className="section-eyebrow text-bone-muted">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Mes siguiente"
          className="h-7 w-7 rounded-sm border border-ink-line text-bone-muted flex items-center justify-center text-sm hover:border-brass hover:text-bone transition-colors"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {WEEKDAY_LABELS.map((w, i) => (
          <span
            key={i}
            className="text-center text-[10px] text-bone-muted/60 uppercase"
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />;

          const iso = toISODate(date);
          const selected = iso === selectedDate;
          const disabled = isBeforeDay(date, floor) || isDayClosed(date);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectDate(iso)}
              className={`aspect-square rounded-sm text-xs flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
                pulsingDate === iso ? "select-pulse" : ""
              }`}
              style={{
                backgroundColor: selected ? primaryColor : "transparent",
                color: selected ? "var(--ink)" : "var(--bone)",
                fontWeight: selected ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!disabled && !selected) {
                  e.currentTarget.style.backgroundColor =
                    "color-mix(in srgb, var(--brass) 12%, transparent)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
