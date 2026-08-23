import { NextRequest, NextResponse } from "next/server";
import { canManageBusiness, getAdminSession, setAdminOrigin } from "@/lib/admin/session";
import { getBusinessIdBySlug } from "@/lib/data/business-repository";

/**
 * Punto de entrada desde el sitio público ("¿Trabajás aquí?"). No renderiza
 * nada — solo decide a dónde mandar al usuario, sin que tenga que conocer
 * ni escribir /admin a mano:
 *
 * - Si ya tiene una sesión que puede gestionar ESTE negocio (dueño de este
 *   negocio, o superadmin) → directo al editor de este negocio.
 * - Si no → a la pantalla de login, ya apuntada a este negocio puntual
 *   (autentica contra la contraseña propia del negocio, no la de RYVO).
 *
 * De paso, si vino con ?from=<slug> (el negocio desde el que hizo clic),
 * lo guarda para que "Cerrar sesión" pueda volver ahí. Es un Route Handler
 * (no una página) porque escribir la cookie del origen requiere estar en
 * un contexto de request/response, no en el render de un Server Component.
 */
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");

  if (from) {
    await setAdminOrigin(from);

    const business = await getBusinessIdBySlug(from);
    const session = await getAdminSession();

    if (business && (await canManageBusiness(session, business.id))) {
      return NextResponse.redirect(
        new URL(`/admin/negocios/${business.id}`, request.url)
      );
    }

    // Sin sesión válida PARA ESTE negocio puntual (aunque haya una sesión
    // de otro negocio activa) → login, ya apuntado a este negocio.
    return NextResponse.redirect(
      new URL(`/admin/login?business=${encodeURIComponent(from)}`, request.url)
    );
  }

  // Sin slug de origen (se entró directo a /admin/entrar): solo tiene
  // sentido para sesiones sin un negocio único (super/partner) — van al
  // listado de negocios; el resto, a loguearse.
  const session = await getAdminSession();
  const destination =
    session?.role === "super" || session?.role === "partner" ? "/admin" : "/admin/login";
  return NextResponse.redirect(new URL(destination, request.url));
}
