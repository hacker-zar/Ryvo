import { Booking, Location, OpeningHours } from "@/types/business";

const DAY_ORDER: OpeningHours["day"][] = [
  "dom",
  "lun",
  "mar",
  "mie",
  "jue",
  "vie",
  "sab",
];

/** Convierte una fecha "YYYY-MM-DD" al código de día usado en OpeningHours. */
export function dayCodeForDate(dateStr: string): OpeningHours["day"] {
  // Se parsea como fecha local (no UTC) para evitar corrimientos de día
  // cerca de medianoche según la zona horaria del servidor.
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return DAY_ORDER[date.getDay()];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Genera los horarios de inicio posibles para un servicio de `durationMin`
 * minutos, dado el horario de apertura del local para ese día, en
 * intervalos de `stepMin` minutos (por defecto cada 30 min).
 *
 * No incluye horarios cuyo turno terminaría después del cierre.
 */
export function generateSlotsForDay(
  openingHours: OpeningHours[],
  dateStr: string,
  durationMin: number,
  stepMin = 30
): string[] {
  const dayCode = dayCodeForDate(dateStr);
  const dayConfig = openingHours.find((oh) => oh.day === dayCode);

  if (!dayConfig || dayConfig.closed || !dayConfig.open || !dayConfig.close) {
    return [];
  }

  const openMin = timeToMinutes(dayConfig.open);
  const closeMin = timeToMinutes(dayConfig.close);

  const slots: string[] = [];
  for (let t = openMin; t + durationMin <= closeMin; t += stepMin) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/**
 * Filtra los horarios ya ocupados por reservas válidas (no canceladas)
 * para ese negocio/local/fecha.
 */
export function filterAvailableSlots(
  allSlots: string[],
  existingBookings: Pick<Booking, "time" | "status">[]
): string[] {
  const takenTimes = new Set(
    existingBookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => b.time.slice(0, 5)) // normaliza "HH:mm:ss" -> "HH:mm"
  );
  return allSlots.filter((slot) => !takenTimes.has(slot));
}

/**
 * Devuelve la ubicación "virtual" para negocios que todavía no tienen
 * filas en la tabla `locations`, usando el horario legado embebido en
 * `businesses.opening_hours`. Mantiene compatibilidad hacia atrás.
 */
export function virtualLocationFromBusiness(business: {
  id: string;
  name: string;
  address: string;
  opening_hours?: OpeningHours[];
}): Location {
  return {
    id: `virtual-${business.id}`,
    business_id: business.id,
    name: business.name,
    address: business.address,
    opening_hours: business.opening_hours ?? [],
    is_primary: true,
    created_at: "",
  };
}
