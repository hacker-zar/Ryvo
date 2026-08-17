import { Booking, BusinessStats, Client, Location, Service } from "@/types/business";
import { generateSlotsForDay } from "@/lib/availability";

// Tamaño de slot de capacidad para el cálculo de ocupación — no tiene por
// qué coincidir con el `stepMin` real de reservas de cada negocio, solo
// necesita ser fino para no subestimar servicios cortos.
export const STATS_OCCUPANCY_SLOT_STEP_MIN = 30;

interface ComputeBusinessStatsInput {
  today: string; // "YYYY-MM-DD"
  rangeDays: number;
  bookings: Pick<
    Booking,
    "date" | "time" | "status" | "service_id" | "client_id"
  >[];
  clients: Pick<Client, "id" | "created_at">[];
  servicesById: Record<string, Pick<Service, "name" | "price" | "duration">>;
  locations: Pick<Location, "opening_hours">[];
}

function daysAgo(dateStr: string, todayStr: string): number {
  const today = new Date(`${todayStr}T00:00:00`);
  const date = new Date(`${dateStr}T00:00:00`);
  return Math.round((today.getTime() - date.getTime()) / 86400000);
}

/**
 * Toda la ventana de estadísticas se calcula en un único pase de
 * agregación: los turnos totales del rango se particionan por estado, así
 * que bookings_pending + confirmed + completed + cancelled + no_show
 * SIEMPRE suma bookings_total — no son estimaciones independientes que
 * puedan desalinearse entre sí.
 */
export function computeBusinessStats(
  input: ComputeBusinessStatsInput
): BusinessStats {
  const { today, rangeDays, bookings, clients, servicesById, locations } =
    input;

  const inWindow = bookings.filter((b) => {
    const diff = daysAgo(b.date, today);
    return diff >= 0 && diff < rangeDays;
  });

  const bookings_total = inWindow.length;
  const bookings_pending = inWindow.filter((b) => b.status === "pending").length;
  const bookings_confirmed = inWindow.filter((b) => b.status === "confirmed").length;
  const bookings_completed = inWindow.filter((b) => b.status === "completed").length;
  const bookings_cancelled = inWindow.filter((b) => b.status === "cancelled").length;
  const bookings_no_show = inWindow.filter((b) => b.status === "no_show").length;

  const clientIdsInWindow = new Set(
    inWindow
      .filter((b) => b.status !== "cancelled" && b.client_id)
      .map((b) => b.client_id as string)
  );
  const clients_total = clientIdsInWindow.size;
  const clients_new = clients.filter((c) => {
    if (!clientIdsInWindow.has(c.id)) return false;
    const diff = daysAgo(c.created_at.slice(0, 10), today);
    return diff >= 0 && diff < rangeDays;
  }).length;
  const clients_returning = clients_total - clients_new;

  const revenue_estimated = inWindow
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (servicesById[b.service_id]?.price ?? 0), 0);

  const serviceCounts = new Map<string, number>();
  for (const b of inWindow) {
    if (b.status === "cancelled") continue;
    serviceCounts.set(b.service_id, (serviceCounts.get(b.service_id) ?? 0) + 1);
  }
  let top_service: BusinessStats["top_service"] = null;
  for (const [serviceId, count] of serviceCounts) {
    if (!top_service || count > top_service.count) {
      top_service = {
        service_id: serviceId,
        name: servicesById[serviceId]?.name ?? "Servicio eliminado",
        count,
      };
    }
  }

  const occupancy_rate = computeOccupancyRate({
    today,
    rangeDays,
    bookings: inWindow,
    servicesById,
    locations,
  });

  return {
    range_days: rangeDays,
    clients_total,
    clients_new,
    clients_returning,
    bookings_total,
    bookings_pending,
    bookings_confirmed,
    bookings_completed,
    bookings_cancelled,
    bookings_no_show,
    revenue_estimated,
    top_service,
    occupancy_rate,
  };
}

/**
 * Ocupación real, no "1 turno = 1 slot": genera slots de capacidad de
 * `STATS_OCCUPANCY_SLOT_STEP_MIN` minutos por local/día en la ventana, y
 * marca ocupados los que caen dentro de la duración real de cada turno no
 * cancelado — un servicio de 90 min ocupa 3 slots de capacidad, no 1.
 */
function computeOccupancyRate(input: {
  today: string;
  rangeDays: number;
  bookings: Pick<Booking, "date" | "time" | "status" | "service_id">[];
  servicesById: Record<string, Pick<Service, "duration">>;
  locations: Pick<Location, "opening_hours">[];
}): number {
  const { today, rangeDays, bookings, servicesById, locations } = input;
  let totalCapacity = 0;
  let totalOccupied = 0;

  for (const location of locations) {
    for (let offset = 0; offset < rangeDays; offset++) {
      const d = new Date(`${today}T00:00:00`);
      d.setDate(d.getDate() - offset);
      const dateStr = d.toISOString().slice(0, 10);

      const slots = generateSlotsForDay(
        location.opening_hours,
        dateStr,
        STATS_OCCUPANCY_SLOT_STEP_MIN,
        STATS_OCCUPANCY_SLOT_STEP_MIN
      );
      if (slots.length === 0) continue;
      totalCapacity += slots.length;

      const dayBookings = bookings.filter(
        (b) => b.date === dateStr && b.status !== "cancelled"
      );
      const occupiedSlots = new Set<string>();
      for (const b of dayBookings) {
        const duration =
          servicesById[b.service_id]?.duration ?? STATS_OCCUPANCY_SLOT_STEP_MIN;
        const [h, m] = b.time.split(":").map(Number);
        const startMin = h * 60 + m;
        for (const slot of slots) {
          const [sh, sm] = slot.split(":").map(Number);
          const slotMin = sh * 60 + sm;
          if (slotMin >= startMin && slotMin < startMin + duration) {
            occupiedSlots.add(slot);
          }
        }
      }
      totalOccupied += occupiedSlots.size;
    }
  }

  return totalCapacity > 0 ? totalOccupied / totalCapacity : 0;
}
