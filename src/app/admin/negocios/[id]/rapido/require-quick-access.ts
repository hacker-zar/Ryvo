import { redirect, notFound } from "next/navigation";
import { AdminSession, canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessById } from "@/lib/data/business-repository";
import { Business } from "@/types/business";

/**
 * Guard compartido por las 6 sub-páginas de Cambios rápidos (Servicios/
 * Profesionales/Locales/Fotos/Catálogo/Información) — un solo lugar en
 * vez de repetir el mismo chequeo 6 veces. Una cuenta "worker" (Barber)
 * NUNCA llega a ver ninguna de estas páginas, ni siquiera tipeando la URL
 * a mano: vuelve al hub de `/rapido`, que para su sesión muestra "Mis
 * turnos" (solo lectura), no Cambios rápidos.
 *
 * Esto es defensa en profundidad de UI/navegación — la autorización REAL
 * de cada escritura vive en `requireAdminFor` (authorize.ts), que cada
 * Server Action de los managers reutilizados (ServicesManager,
 * ProfessionalsManager, etc.) ya llama por su cuenta. Aunque esta guard
 * tuviera un bug, ningún Server Action de escritura confía en ella.
 */
export async function requireQuickChangesAccess(businessId: string): Promise<{
  session: AdminSession;
  business: Business;
}> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (!(await canManageBusiness(session, businessId))) redirect("/admin");

  if (session.role === "owner" && session.accountRole === "worker") {
    redirect(`/admin/negocios/${businessId}/rapido`);
  }

  const business = await getBusinessById(businessId);
  if (!business) notFound();

  return { session, business };
}
