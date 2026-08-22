import { NextRequest, NextResponse } from "next/server";
import { dispatchDueNotifications } from "@/lib/notifications/dispatch";

/**
 * Único disparador de los eventos PROGRAMADOS (hoy: reminder_24h) — los
 * reactivos (booking creado/confirmado/cancelado/reprogramado) ya se
 * envían en el momento desde la propia Server Action (ver
 * dispatchDueNotificationsForBooking en booking-actions.ts/admin
 * actions.ts) y no dependen de este endpoint. pensado para Vercel Cron
 * (ver vercel.json) en vez de pg_cron/pg_net: cero extensiones nuevas de
 * Postgres, toda la infraestructura ya es Next.js en Vercel.
 *
 * Protegido con CRON_SECRET (no configurado todavía en este proyecto) —
 * sin la variable de entorno, el endpoint rechaza cualquier request en
 * vez de aceptar sends sin autenticar: mismo criterio de "no fingir que
 * algo está listo cuando falta configuración" que el resto del proyecto
 * (SUPABASE_SERVICE_ROLE_KEY, WhatsApp Cloud API).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado — este endpoint está deshabilitado." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await dispatchDueNotifications();
  return NextResponse.json(result);
}
