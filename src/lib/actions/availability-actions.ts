"use server";

import {
  getBookedSlots,
  getBookedSlotsForProfessionals,
} from "@/lib/data/business-repository";
import {
  filterAvailableSlots,
  generateSlotsForDay,
  unionAvailableSlots,
} from "@/lib/availability";
import { OpeningHours } from "@/types/business";

export interface AvailabilityQuery {
  businessId: string;
  locationId: string | null;
  date: string;
  // null = el servicio elegido no tiene duración configurada — no hay
  // forma de calcular horarios reales para él (ver getAvailableSlots,
  // que devuelve vacío en vez de inventar una duración).
  serviceDurationMin: number | null;
  openingHours: OpeningHours[];
  // Reserva con UN profesional específico.
  professionalId?: string;
  // "Cualquiera disponible" — ya resueltos client-side (qualifiedProfessionalIds
  // de src/lib/availability.ts) a partir de los profesionales activos del
  // negocio y el servicio elegido.
  qualifiedProfessionalIds?: string[];
  // Reprogramar: excluye la propia reserva actual para que su horario no
  // se vea como ocupado por sí misma.
  excludeBookingId?: string;
}

export async function getAvailableSlots(
  query: AvailabilityQuery
): Promise<string[]> {
  if (query.serviceDurationMin == null) return [];

  const allSlots = generateSlotsForDay(
    query.openingHours,
    query.date,
    query.serviceDurationMin
  );

  if (allSlots.length === 0) return [];

  if (query.professionalId) {
    const booked = await getBookedSlots(
      query.businessId,
      query.locationId,
      query.date,
      query.professionalId,
      query.excludeBookingId
    );
    return filterAvailableSlots(allSlots, booked, query.serviceDurationMin);
  }

  if (query.qualifiedProfessionalIds && query.qualifiedProfessionalIds.length > 0) {
    const byProfessional = await getBookedSlotsForProfessionals(
      query.businessId,
      query.locationId,
      query.date,
      query.qualifiedProfessionalIds
    );
    return unionAvailableSlots(allSlots, byProfessional, query.serviceDurationMin);
  }

  // Negocio sin profesionales configurados — mismo código de siempre.
  const booked = await getBookedSlots(
    query.businessId,
    query.locationId,
    query.date,
    undefined,
    query.excludeBookingId
  );
  return filterAvailableSlots(allSlots, booked, query.serviceDurationMin);
}
