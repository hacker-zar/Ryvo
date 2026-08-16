import { NextRequest, NextResponse } from "next/server";
import { hasValidAdminSession, setAdminOrigin } from "@/lib/admin/session";

/**
 * Punto de entrada desde el sitio público ("¿Trabajás aquí?"). No renderiza
 * nada — solo decide a dónde mandar al usuario, sin que tenga que conocer
 * ni escribir /admin a mano:
 *
 * - Si ya tiene sesión válida → directo al editor (/admin).
 * - Si no → a la pantalla de login, que a su vez ya redirige a /admin
 *   apenas el login es exitoso.
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
  }

  const isLoggedIn = await hasValidAdminSession();
  const destination = isLoggedIn ? "/admin" : "/admin/login";

  return NextResponse.redirect(new URL(destination, request.url));
}
