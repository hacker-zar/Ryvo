import { NotificationEventPayload, NotificationEventType } from "@/types/business";

// Textos fijos de RYVO — no editables por el negocio (mismo criterio que
// gallery_layout/image_radius: presets controlados, no texto libre) para
// que ningún negocio mande un mensaje mal escrito o poco profesional en
// nombre de RYVO. Si en el futuro se necesita personalización, el punto
// de extensión es este archivo (agregar variantes), no exponer un campo
// de texto libre en el editor.

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

export function buildWhatsAppMessage(
  type: NotificationEventType,
  payload: NotificationEventPayload
): string {
  const when = `${formatDateLong(payload.date)} a las ${payload.time.slice(0, 5)}`;

  switch (type) {
    case "booking_created":
      return `Hola ${payload.customer_name}! Tu turno en ${payload.business_name} quedó registrado para ${when} (${payload.service_name}). Te vamos a avisar cuando se confirme.`;
    case "booking_confirmed":
      return `${payload.customer_name}, tu turno en ${payload.business_name} para ${when} (${payload.service_name}) está confirmado. Te esperamos!`;
    case "booking_cancelled":
      return `${payload.customer_name}, tu turno en ${payload.business_name} para ${when} fue cancelado. Si fue un error o querés reprogramar, contactanos.`;
    case "booking_rescheduled":
      return `${payload.customer_name}, tu turno en ${payload.business_name} fue reprogramado para ${when} (${payload.service_name}).`;
    case "reminder_24h":
      return `Hola ${payload.customer_name}! Te recordamos tu turno mañana en ${payload.business_name} a las ${payload.time.slice(0, 5)} (${payload.service_name}).`;
  }
}
