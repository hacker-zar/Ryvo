"use server";

import {
  cancelBookingById,
  createBooking,
  getServiceDuration,
  rescheduleBookingById,
  resolveAnyProfessional,
} from "@/lib/data/business-repository";
import { dispatchDueNotificationsForBooking } from "@/lib/notifications/dispatch";

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

  // Chequeo temprano y explícito: un servicio sin duración configurada no
  // se puede reservar online (el motor de disponibilidad no tiene forma
  // de calcular el intervalo que ocuparía) — se rechaza acá antes de
  // intentar resolver profesional/crear la reserva, en vez de inventar una
  // duración por defecto en algún paso más adelante.
  const durationMin = await getServiceDuration(input.service_id);
  if (durationMin == null) {
    return {
      success: false,
      error:
        "Este servicio todavía no tiene una duración configurada y no se puede reservar online. Contactá al negocio directamente para coordinarlo.",
    };
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

  const result = await createBooking({ ...input, professional_id: professionalId });
  // Envío inmediato del evento reactivo recién encolado (ver createBooking
  // → enqueueBookingCreatedNotifications) — no bloquea ni puede fallar la
  // respuesta al cliente, que ya tiene su reserva confirmada en `result`.
  if (result.success && result.id) {
    await dispatchDueNotificationsForBooking(result.id);
  }
  return result;
}

/** Cancelar/reprogramar el propio turno, sin sesión — el id de la reserva
 *  (UUID no adivinable) ES la autorización, igual que hoy no hay ninguna
 *  otra forma de referenciar una reserva ajena. */
export async function cancelBooking(bookingId: string) {
  if (!bookingId) return { success: false, error: "Turno no encontrado." };
  const result = await cancelBookingById(bookingId);
  if (result.success) {
    await dispatchDueNotificationsForBooking(bookingId);
  }
  return result;
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  time: string
) {
  if (!bookingId || !date || !time) {
    return { success: false, error: "Completá fecha y hora." };
  }
  const result = await rescheduleBookingById(bookingId, date, time);
  if (result.success) {
    await dispatchDueNotificationsForBooking(bookingId);
  }
  return result;
}
