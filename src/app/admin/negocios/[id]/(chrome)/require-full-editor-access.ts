import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";

/**
 * El editor completo (esta página — Apariencia/Página/Servicios/
 * Profesionales/Productos/Reservas/Automatizaciones/Plantilla, con
 * preview en vivo — y su iframe de preview, ver preview/page.tsx) es
 * exclusivo de superadmin y Partner. Un Owner (dueño de UN negocio, sea
 * `accountRole` "owner" o "worker") lo tiene bloqueado y va a Cambios
 * rápidos en su lugar (ver /rapido) — pedido explícito del usuario, no
 * una interpretación.
 *
 * Esto NO afecta Turnos/Clientes/Estadísticas/Oportunidades/Cuenta —
 * siguen abiertas para Owner tal cual estaban: son herramientas
 * operativas del negocio, no el editor de diseño, y Cuenta en particular
 * es donde Owner crea las cuentas Barber de su negocio — sacarle el
 * acceso ahí lo dejaría sin forma de dar de alta a su equipo.
 *
 * `(chrome)/layout.tsx` ya garantizó sesión válida + `canManageBusiness`
 * antes de que esta página se renderice — acá solo hace falta el
 * chequeo específico de rol.
 */
export async function requireFullEditorAccess(businessId: string): Promise<void> {
  const session = await getAdminSession();
  if (session?.role === "owner") {
    redirect(`/admin/negocios/${businessId}/rapido`);
  }
}
