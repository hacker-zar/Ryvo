"use server";

import {
  cancelBookingById,
  createBooking,
  rescheduleBookingById,
  resolveAnyProfessional,
} from "@/lib/data/business-repository";

export interface CreateBookingInput {
  business_id: string;
  service_id: string;
  location_id: string | null;
  // "any" = "Cualquiera disponible", resuelto server-side a un profesional
  // real antes de insertar — nunca se guarda una reserva con profesional
  // ambiguo. null/undefined = negocio sin profesionales configurados.
  professional_id?: string | "any" | null;
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

  let professionalId: string | null = null;
  if (input.professional_id === "any") {
    professionalId = await resolveAnyProfessional(
      input.business_id,
      input.service_id,
      input.location_id,
      input.date,
      input.time
    );
    if (!professionalId) {
      return {
        success: false,
        conflict: true,
        error: "Ese horario ya no tiene profesionales disponibles. Elegí otro.",
      };
    }
  } else if (input.professional_id) {
    professionalId = input.professional_id;
  }

  return createBooking({ ...input, professional_id: professionalId });
}

/** Cancelar/reprogramar el propio turno, sin sesión — el id de la reserva
 *  (UUID no adivinable) ES la autorización, igual que hoy no hay ninguna
 *  otra forma de referenciar una reserva ajena. */
export async function cancelBooking(bookingId: string) {
  if (!bookingId) return { success: false, error: "Turno no encontrado." };
  return cancelBookingById(bookingId);
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  time: string
) {
  if (!bookingId || !date || !time) {
    return { success: false, error: "Completá fecha y hora." };
  }
  return rescheduleBookingById(bookingId, date, time);
}
