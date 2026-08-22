// Adapter al proveedor real de envío — WhatsApp Cloud API (Meta Business).
// Fetch nativo, sin agregar ninguna dependencia nueva al proyecto. Sin
// las credenciales configuradas, NUNCA se finge un envío exitoso (mismo
// criterio que "SUPABASE_SERVICE_ROLE_KEY sin configurar" en el resto del
// proyecto): se devuelve un error explícito para que quede registrado en
// notification_events.error, no un "sent" falso.
//
// Credenciales necesarias (no configuradas en este proyecto todavía):
//   WHATSAPP_CLOUD_API_TOKEN     — token permanente de la app de Meta
//   WHATSAPP_PHONE_NUMBER_ID     — id del número de WhatsApp verificado
//
// Referencia: https://developers.facebook.com/docs/whatsapp/cloud-api

export interface SendWhatsAppResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export async function sendWhatsAppMessage(
  toPhone: string,
  body: string
): Promise<SendWhatsAppResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      success: false,
      error:
        "WhatsApp Cloud API no está configurada (falta WHATSAPP_CLOUD_API_TOKEN/WHATSAPP_PHONE_NUMBER_ID).",
    };
  }

  const to = normalizePhone(toPhone);
  if (!to) {
    return { success: false, error: "Número de destino inválido." };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message ?? `WhatsApp Cloud API devolvió ${response.status}.`,
      };
    }

    const providerMessageId = data?.messages?.[0]?.id as string | undefined;
    return { success: true, providerMessageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error de red al contactar WhatsApp Cloud API.",
    };
  }
}
