import {
  Booking,
  Client,
  Location,
  LowOccupancySlot,
  Opportunity,
  OpportunityClientRow,
  Service,
} from "@/types/business";
import { dayCodeForDate, generateSlotsForDay } from "@/lib/availability";

// Ninguna de estas heurísticas es exacta — son umbrales explícitos y
// documentados, no números mágicos sueltos, para que se puedan ajustar a
// futuro sin tener que releer la lógica entera.
export const OPPORTUNITY_THRESHOLDS = {
  RETURNING_SOON_WINDOW_DAYS: 7,
  OVERDUE_GRACE_DAYS: 5,
  NEVER_RETURNED_MIN_DAYS: 45,
  CANCELLED_LOOKBACK_DAYS: 7,
  LOW_OCCUPANCY_LOOKBACK_DAYS: 28,
  LOW_OCCUPANCY_THRESHOLD: 0.3,
} as const;

const TIME_BLOCKS = [
  { start: 9 * 60, end: 12 * 60, label: "09:00–12:00" },
  { start: 12 * 60, end: 15 * 60, label: "12:00–15:00" },
  { start: 15 * 60, end: 18 * 60, label: "15:00–18:00" },
  { start: 18 * 60, end: 21 * 60, label: "18:00–21:00" },
] as const;

const DAY_LABELS: Record<string, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

/** `referenceDate - pastDate` en días (positivo si `pastDate` es anterior). */
function daysAgo(pastDate: string, referenceDate: string): number {
  const a = new Date(`${pastDate}T00:00:00`);
  const b = new Date(`${referenceDate}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

interface ClientFrequencyInfo {
  client: Client;
  completedCount: number;
  lastVisit: string | null;
  lastServiceId: string | null;
  frequencyDays: number | null; // solo si hay >=2 turnos completados
  predictedNext: string | null;
  hasFutureBooking: boolean;
}

function computeClientFrequencyInfo(
  today: string,
  client: Client,
  bookings: Booking[]
): ClientFrequencyInfo {
  const clientBookings = bookings.filter((b) => b.client_id === client.id);
  const completed = clientBookings
    .filter((b) => b.status === "completed")
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const hasFutureBooking = clientBookings.some(
    (b) =>
      (b.status === "pending" || b.status === "confirmed") &&
      daysAgo(b.date, today) <= 0 // date >= today
  );

  const last = completed[completed.length - 1] ?? null;

  let frequencyDays: number | null = null;
  if (completed.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < completed.length; i++) {
      gaps.push(daysAgo(completed[i - 1].date, completed[i].date));
    }
    frequencyDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  const predictedNext =
    last && frequencyDays !== null ? addDays(last.date, frequencyDays) : null;

  return {
    client,
    completedCount: completed.length,
    lastVisit: last?.date ?? null,
    lastServiceId: last?.service_id ?? null,
    frequencyDays,
    predictedNext,
    hasFutureBooking,
  };
}

function toRow(
  info: ClientFrequencyInfo,
  today: string,
  servicesById: Record<string, Pick<Service, "name">>
): OpportunityClientRow {
  return {
    client_id: info.client.id,
    client_name: info.client.name,
    client_phone: info.client.phone,
    last_visit: info.lastVisit,
    service_name: info.lastServiceId
      ? (servicesById[info.lastServiceId]?.name ?? "Servicio eliminado")
      : null,
    days_since_last_visit: info.lastVisit
      ? daysAgo(info.lastVisit, today)
      : null,
    usual_frequency_days:
      info.frequencyDays !== null ? Math.round(info.frequencyDays) : null,
    status: "completed",
  };
}

function detectLowOccupancy(
  today: string,
  bookings: Booking[],
  servicesById: Record<string, Pick<Service, "duration">>,
  locations: Location[]
): Opportunity {
  interface Bucket {
    location_name: string;
    day_label: string;
    capacity: number;
    occupied: number;
  }
  const buckets = new Map<string, Bucket>();

  for (const location of locations) {
    for (
      let offset = 0;
      offset < OPPORTUNITY_THRESHOLDS.LOW_OCCUPANCY_LOOKBACK_DAYS;
      offset++
    ) {
      const dateStr = addDays(today, -offset);
      const dayCode = dayCodeForDate(dateStr);
      const daySlots = generateSlotsForDay(location.opening_hours, dateStr, 30, 30);
      if (daySlots.length === 0) continue;

      const dayBookings = bookings.filter(
        (b) =>
          b.location_id === location.id &&
          b.date === dateStr &&
          b.status !== "cancelled"
      );

      for (const block of TIME_BLOCKS) {
        const blockSlots = daySlots.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          const min = h * 60 + m;
          return min >= block.start && min < block.end;
        });
        if (blockSlots.length === 0) continue;

        const key = `${location.id}|${dayCode}|${block.label}`;
        const bucket = buckets.get(key) ?? {
          location_name: location.name,
          day_label: `${DAY_LABELS[dayCode]} ${block.label}`,
          capacity: 0,
          occupied: 0,
        };
        bucket.capacity += blockSlots.length;

        const occupiedSet = new Set<string>();
        for (const b of dayBookings) {
          const duration = servicesById[b.service_id]?.duration ?? 30;
          const [bh, bm] = b.time.split(":").map(Number);
          const startMin = bh * 60 + bm;
          for (const slot of blockSlots) {
            const [sh, sm] = slot.split(":").map(Number);
            const slotMin = sh * 60 + sm;
            if (slotMin >= startMin && slotMin < startMin + duration) {
              occupiedSet.add(slot);
            }
          }
        }
        bucket.occupied += occupiedSet.size;
        buckets.set(key, bucket);
      }
    }
  }

  const slots: LowOccupancySlot[] = [...buckets.values()]
    .filter((b) => b.capacity > 0)
    .map((b) => ({
      day_label: b.day_label,
      location_name: b.location_name,
      occupancy_rate: b.occupied / b.capacity,
    }))
    .filter((s) => s.occupancy_rate < OPPORTUNITY_THRESHOLDS.LOW_OCCUPANCY_THRESHOLD)
    .sort((a, b) => a.occupancy_rate - b.occupancy_rate)
    .slice(0, 5);

  return {
    type: "low_occupancy_slot",
    title: `${slots.length} ${plural(slots.length, "horario tiene", "horarios tienen")} baja ocupación`,
    count: slots.length,
    slots,
  };
}

/**
 * Detecta oportunidades accionables a partir de clientes/turnos ya
 * cargados — sin llamadas a Supabase adentro, a propósito: es el punto de
 * enganche para automatizaciones futuras (recordatorios, recuperación de
 * clientes, rebooking automático). Un futuro worker puede llamar esta
 * misma función en vez de reimplementar la detección.
 */
export function detectOpportunities(input: {
  today: string;
  clients: Client[];
  bookings: Booking[];
  servicesById: Record<string, Pick<Service, "name" | "duration">>;
  locations: Location[];
}): Opportunity[] {
  const { today, clients, bookings, servicesById, locations } = input;

  const frequencyInfos = clients.map((c) =>
    computeClientFrequencyInfo(today, c, bookings)
  );

  const returningSoon = frequencyInfos.filter((info) => {
    if (info.hasFutureBooking || !info.predictedNext) return false;
    const diff = daysAgo(today, info.predictedNext); // predictedNext - today
    return diff >= 0 && diff <= OPPORTUNITY_THRESHOLDS.RETURNING_SOON_WINDOW_DAYS;
  });

  const overdue = frequencyInfos.filter((info) => {
    if (info.hasFutureBooking || !info.predictedNext) return false;
    const diff = daysAgo(info.predictedNext, today); // today - predictedNext
    return diff > OPPORTUNITY_THRESHOLDS.OVERDUE_GRACE_DAYS;
  });

  const neverReturned = frequencyInfos.filter((info) => {
    if (info.hasFutureBooking || info.completedCount !== 1 || !info.lastVisit) {
      return false;
    }
    return (
      daysAgo(info.lastVisit, today) > OPPORTUNITY_THRESHOLDS.NEVER_RETURNED_MIN_DAYS
    );
  });

  const cancelledThisWeek = bookings.filter((b) => {
    if (b.status !== "cancelled") return false;
    const diff = daysAgo(b.updated_at.slice(0, 10), today);
    return diff >= 0 && diff <= OPPORTUNITY_THRESHOLDS.CANCELLED_LOOKBACK_DAYS;
  });
  const clientsById = new Map(clients.map((c) => [c.id, c]));

  return [
    {
      type: "returning_soon",
      title: `${returningSoon.length} ${plural(returningSoon.length, "cliente está", "clientes están")} próximo${plural(returningSoon.length, "", "s")} a volver`,
      count: returningSoon.length,
      clients: returningSoon.map((info) => toRow(info, today, servicesById)),
    },
    {
      type: "never_returned",
      title: `${neverReturned.length} ${plural(neverReturned.length, "cliente no volvió", "clientes no volvieron")} después de su primera visita`,
      count: neverReturned.length,
      clients: neverReturned.map((info) => toRow(info, today, servicesById)),
    },
    {
      type: "cancelled_this_week",
      title: `${cancelledThisWeek.length} ${plural(cancelledThisWeek.length, "turno fue cancelado", "turnos fueron cancelados")} esta semana`,
      count: cancelledThisWeek.length,
      clients: cancelledThisWeek.map((b) => {
        const client = b.client_id ? clientsById.get(b.client_id) : undefined;
        return {
          client_id: b.client_id ?? "",
          client_name: client?.name ?? b.customer_name,
          client_phone: client?.phone ?? b.customer_phone,
          last_visit: b.date,
          service_name: servicesById[b.service_id]?.name ?? "Servicio eliminado",
          days_since_last_visit: null,
          usual_frequency_days: null,
          status: "cancelled",
        };
      }),
    },
    detectLowOccupancy(today, bookings, servicesById, locations),
    {
      type: "overdue_vs_frequency",
      title: `${overdue.length} ${plural(overdue.length, "cliente está", "clientes están")} demorado${plural(overdue.length, "", "s")} respecto de su frecuencia habitual`,
      count: overdue.length,
      clients: overdue.map((info) => toRow(info, today, servicesById)),
    },
  ];
}
