import {
  listDueNotificationEvents,
  listDueNotificationEventsForBooking,
  markNotificationEventFailed,
  markNotificationEventSent,
  type DueNotificationEvent,
} from "@/lib/data/business-repository";
import { buildWhatsAppMessage } from "@/lib/notifications/messages";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp-provider";

/**
 * Único punto que efectivamente intenta ENVIAR — todo lo demás
 * (enqueueNotificationEvent y las funciones que la envuelven, en
 * business-repository.ts) solo escribe filas en `notification_events`.
 * Nunca debe tirar: un fallo de envío se registra en la fila
 * (status='failed' + error) y se sigue con el resto, nunca interrumpe al
 * llamador (una Server Action de booking, o el endpoint de cron).
 */
async function sendOne(event: DueNotificationEvent): Promise<void> {
  const body = buildWhatsAppMessage(event.type, event.payload);
  const result = await sendWhatsAppMessage(event.recipient, body);
  if (result.success) {
    await markNotificationEventSent(event.id, result.providerMessageId ?? null);
  } else {
    await markNotificationEventFailed(event.id, result.error ?? "Error desconocido al enviar.");
  }
}

/** Llamado desde el endpoint de cron (ver app/api/cron/notifications) —
 *  procesa TODOS los eventos vencidos de TODOS los negocios, en tandas
 *  acotadas por `limit` para no disparar de más en una sola invocación. */
export async function dispatchDueNotifications(limit = 25): Promise<{ processed: number }> {
  const events = await listDueNotificationEvents(limit);
  for (const event of events) {
    await sendOne(event);
  }
  return { processed: events.length };
}

/** Llamado desde la capa de acciones (booking-actions.ts/admin actions)
 *  justo después de que una mutación de bookings ya se confirmó — envía
 *  YA el evento reactivo recién encolado para ESE turno, sin esperar al
 *  próximo tick del cron. Acotado a un booking puntual: no reemplaza al
 *  cron (que sigue siendo la única vía real para los recordatorios 24h,
 *  que se encolan con scheduled_for futuro). Nunca debe tirar — se llama
 *  siempre en paralelo al resultado real de la acción, nunca
 *  condicionando su éxito. */
export async function dispatchDueNotificationsForBooking(bookingId: string): Promise<void> {
  try {
    const events = await listDueNotificationEventsForBooking(bookingId, 5);
    for (const event of events) {
      await sendOne(event);
    }
  } catch {
    // Un fallo acá nunca debe volver a la Server Action que lo llamó.
  }
}
