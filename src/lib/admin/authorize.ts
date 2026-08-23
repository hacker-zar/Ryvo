import { AdminSession, canManageBusiness, getAdminSession } from "@/lib/admin/session";

/**
 * Punto único de autorización para las server actions del admin. Antes de
 * este archivo, cada acción solo chequeaba "¿hay alguna sesión de admin
 * válida?" sin verificar a qué negocio pertenecía — cualquier sesión podía
 * tocar cualquier negocio. Ahora cada acción que recibe un `businessId`
 * debe pasar por acá primero.
 *
 * Exclusiva de dueño/superadmin/partner — una cuenta "worker"
 * (Barber, Editor rápido de solo lectura de turnos propios, ver
 * getMyBookings en actions.ts) SIEMPRE es rechazada acá, aunque
 * `canManageBusiness` la dejaría pasar (esa función solo mira
 * `businessId`, no el rol dentro del negocio). Es la garantía de fondo de
 * "un Barber no puede llamar ninguna acción de escritura del negocio
 * aunque conozca los nombres" — Worker no tiene NINGUNA Server Action de
 * escritura habilitada, por diseño.
 */
export async function requireAdminFor(businessId: string): Promise<void> {
  const session = await getAdminSession();
  if (!(await canManageBusiness(session, businessId))) {
    throw new Error("No autorizado para gestionar este negocio.");
  }
  if (session!.role === "owner" && session!.accountRole === "worker") {
    throw new Error("No autorizado para gestionar este negocio.");
  }
}

/** Para operaciones que solo RYVO puede hacer (ej: crear/asignar Partners). */
export async function requireSuperAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session || session.role !== "super") {
    throw new Error("No autorizado.");
  }
}

/**
 * Crear negocios nuevos: exclusivo de RYVO (super) o de un Partner (que
 * queda auto-asignado al negocio que crea — ver adminCreateBusiness en
 * actions.ts). Devuelve la sesión ya validada para que el caller sepa
 * cuál de los dos casos es, sin volver a consultarla.
 */
export async function requireSuperAdminOrPartner(): Promise<
  Extract<AdminSession, { role: "super" | "partner" }>
> {
  const session = await getAdminSession();
  if (!session || (session.role !== "super" && session.role !== "partner")) {
    throw new Error("No autorizado.");
  }
  return session;
}

export type BusinessMemberAccess =
  | { scope: "full" }
  | { scope: "worker"; professionalId: string };

/**
 * Para las pocas Server Actions que SÍ puede llamar una cuenta "worker"
 * (Barber) — hoy, ninguna de escritura: el único llamador es
 * `getMyBookings` (solo lectura, ver actions.ts). Dueño/admin/partner/
 * superadmin siguen entrando sin restricción adicional (`scope: "full"`).
 * El `professionalId` devuelto sale de la sesión firmada, nunca de un
 * parámetro de la request.
 */
export async function requireBusinessMember(
  businessId: string
): Promise<BusinessMemberAccess> {
  const session = await getAdminSession();
  if (!(await canManageBusiness(session, businessId))) {
    throw new Error("No autorizado para gestionar este negocio.");
  }
  if (session!.role === "owner" && session!.accountRole === "worker") {
    if (!session!.professionalId) {
      throw new Error("Esta cuenta no está vinculada a ningún profesional.");
    }
    return { scope: "worker", professionalId: session!.professionalId };
  }
  return { scope: "full" };
}
