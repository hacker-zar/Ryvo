"use server";

import { getBookedSlots } from "@/lib/data/business-repository";
import {
  filterAvailableSlots,
  generateSlotsForDay,
} from "@/lib/availability";
import { OpeningHours } from "@/types/business";

export interface AvailabilityQuery {
  businessId: string;
  locationId: string | null;
  date: string;
  serviceDurationMin: number;
  openingHours: OpeningHours[];
}

export async function getAvailableSlots(
  query: AvailabilityQuery
): Promise<string[]> {
  const allSlots = generateSlotsForDay(
    query.openingHours,
    query.date,
    query.serviceDurationMin
  );

  if (allSlots.length === 0) return [];

  const booked = await getBookedSlots(
    query.businessId,
    query.locationId,
    query.date
  );

  return filterAvailableSlots(allSlots, booked);
}
