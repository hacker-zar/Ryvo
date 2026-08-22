// Helpers puros de presentación para la Agenda — complementan
// availability.ts (reutiliza timeToMinutes/minutesToTime de ahí) en vez
// de reimplementar nada del motor real de reservas. Este archivo NO sabe
// nada de Supabase ni de qué servicio/profesional puede reservarse en un
// huevo — eso sigue siendo exclusivo de getAvailableSlots/
// filterAvailableSlots (ver lib/actions/availability-actions.ts).
//
// IMPORTANTE (distinción real, no cosmética): un hueco que devuelve
// `computeFreeGaps` significa únicamente "no hay ningún booking activo
// en este rango" — es un hecho que se puede leer directo de los
// bookings del día, sin consultar nada más. NO significa "se puede
// reservar acá": eso depende de servicio/profesional/duración elegidos,
// y solo el motor real (getAvailableSlots) puede confirmarlo. La UI de
// la Agenda debe etiquetar estos huecos como "Libre", nunca como
// "Disponible" — esa palabra queda reservada para cuando el wizard de
// reserva (StepDateTime, mismo Server Action de siempre) ya confirmó que
// ese horario puntual es reservable.

import { timeToMinutes, minutesToTime } from "@/lib/availability";

export interface MinuteRange {
  start: number;
  end: number;
}

// Huecos más cortos que esto no se muestran — son ruido visual (turnos
// pegados uno al otro dejan un resto de 1-2 minutos que no aporta nada).
const MIN_GAP_MINUTES = 5;

/** Complemento de `booked` dentro de [openMin, closeMin) — los huecos
 *  "libres" de un timeline ya renderizado. Pura: no consulta nada, no
 *  sabe de negocios/profesionales, solo hace aritmética de intervalos
 *  (mismo tipo de cálculo que intervalsOverlap, pero para el hueco
 *  complementario en vez de para detectar solapamiento). */
export function computeFreeGaps(
  openMin: number,
  closeMin: number,
  booked: MinuteRange[]
): MinuteRange[] {
  if (openMin >= closeMin) return [];

  const sorted = [...booked]
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged: MinuteRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const gaps: MinuteRange[] = [];
  let cursor = openMin;
  for (const range of merged) {
    const start = Math.max(range.start, openMin);
    const end = Math.min(range.end, closeMin);
    if (start > cursor) gaps.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < closeMin) gaps.push({ start: cursor, end: closeMin });

  return gaps.filter((g) => g.end - g.start >= MIN_GAP_MINUTES);
}

/** Rango [time, time+duration_min) de un booking, en minutos desde
 *  medianoche — el mismo par de valores que ya usa intervalsOverlap,
 *  reempaquetado como MinuteRange para pasarlo a computeFreeGaps. */
export function bookingRange(time: string, durationMin: number): MinuteRange {
  const start = timeToMinutes(time);
  return { start, end: start + durationMin };
}

export { timeToMinutes, minutesToTime };

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" + N días (N puede ser negativo) — parseo como fecha
 *  LOCAL, no UTC, mismo criterio que dayCodeForDate en availability.ts
 *  (evita corrimientos de día cerca de medianoche). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Lunes de la semana que contiene `dateStr` — la vista Semana siempre
 *  arranca en lunes, sin importar qué día se esté mirando. */
export function mondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 = domingo ... 6 = sábado
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}
