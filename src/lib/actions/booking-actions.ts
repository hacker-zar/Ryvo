"use server";

import { createBooking } from "@/lib/data/business-repository";

export interface CreateBookingInput {
  business_id: string;
  service_id: string;
  location_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time: string;
}

export async function submitBooking(input: CreateBookingInput) {
  if (
    !input.business_id ||
    !input.service_id ||
    !input.customer_name.trim() ||
    !input.customer_phone.trim() ||
    !input.date ||
    !input.time
  ) {
    return { success: false, error: "Completá todos los campos." };
  }

  return createBooking(input);
}
