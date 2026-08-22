import { Booking, Location, OpeningHours, ProfessionalWithServices } from "@/types/business";

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

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * true si el intervalo [aStartMin, aStartMin+aDurationMin) se solapa con
 * [bStartMin, bStartMin+bDurationMin) — semiabierto en ambos: un fin
 * exacto no cuenta como solapamiento (10:00-11:00 no choca con
 * 11:00-11:30). Única fuente de la matemática de solapamiento — la
 * reutilizan filterAvailableSlots, resolveAnyProfessional y createBooking
 * (business-repository.ts) para que los tres puntos de chequeo no puedan
 * volver a divergir entre sí.
 */
export function intervalsOverlap(
  aStartMin: number,
  aDurationMin: number,
  bStartMin: number,
  bDurationMin: number
): boolean {
  const aEnd = aStartMin + aDurationMin;
  const bEnd = bStartMin + bDurationMin;
  return aStartMin < bEnd && bStartMin < aEnd;
}

export function minutesToTime(mins: number): string {
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
 * Filtra los horarios cuyo intervalo [slot, slot+durationMin) se
 * solaparía con alguna reserva válida (no cancelada) existente — no solo
 * los que coinciden en la hora exacta de inicio (ver intervalsOverlap).
 */
export function filterAvailableSlots(
  allSlots: string[],
  existingBookings: Pick<Booking, "time" | "status" | "duration_min">[],
  durationMin: number
): string[] {
  const activeRanges = existingBookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      start: timeToMinutes(b.time.slice(0, 5)), // normaliza "HH:mm:ss" -> "HH:mm"
      duration: b.duration_min,
    }));

  return allSlots.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    return !activeRanges.some((r) =>
      intervalsOverlap(slotStart, durationMin, r.start, r.duration)
    );
  });
}

/**
 * "Cualquiera disponible": un horario está libre si AL MENOS UN
 * profesional calificado lo tiene libre — es una unión de N sets de
 * disponibilidad individuales, no un simple filtro (por eso no reutiliza
 * `filterAvailableSlots` directamente, aunque lo llama por dentro para
 * cada profesional).
 */
export function unionAvailableSlots(
  allSlots: string[],
  bookingsByProfessional: Map<string, Pick<Booking, "time" | "status" | "duration_min">[]>,
  durationMin: number
): string[] {
  const available = new Set<string>();
  for (const bookings of bookingsByProfessional.values()) {
    for (const slot of filterAvailableSlots(allSlots, bookings, durationMin)) {
      available.add(slot);
    }
  }
  return allSlots.filter((s) => available.has(s));
}

/** Filtro puro client-side (sin red): profesionales activos que pueden
 *  realizar `serviceId` — sin ninguna asociación explícita califica para
 *  todos (misma regla de compatibilidad que el lado servidor). */
export function qualifiedProfessionalIds(
  professionals: Pick<ProfessionalWithServices, "id" | "active" | "service_ids">[],
  serviceId: string
): string[] {
  return professionals
    .filter((p) => p.active)
    .filter((p) => p.service_ids.length === 0 || p.service_ids.includes(serviceId))
    .map((p) => p.id);
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
