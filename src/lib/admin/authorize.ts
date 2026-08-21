import { canManageBusiness, getAdminSession } from "@/lib/admin/session";

/**
 * Punto único de autorización para las server actions del admin. Antes de
 * este archivo, cada acción solo chequeaba "¿hay alguna sesión de admin
 * válida?" sin verificar a qué negocio pertenecía — cualquier sesión podía
 * tocar cualquier negocio. Ahora cada acción que recibe un `businessId`
 * debe pasar por acá primero.
 *
 * Exclusiva de dueño/admin/superadmin — una cuenta "worker" (Editor
 * rápido, ver requireBusinessMember más abajo) SIEMPRE es rechazada acá,
 * aunque `canManageBusiness` la dejaría pasar (esa función solo mira
 * `businessId`, no el rol dentro del negocio). Es la garantía de fondo de
 * "el profesional no puede llamar cualquier acción del editor completo
 * aunque conozca su nombre" — cambio de comportamiento nulo para
 * cualquier cuenta existente hoy, porque hasta el Editor rápido no
 * existía ninguna cuenta "worker".
 */
export async function requireAdminFor(businessId: string): Promise<void> {
  const session = await getAdminSession();
  if (!canManageBusiness(session, businessId)) {
    throw new Error("No autorizado para gestionar este negocio.");
  }
  if (session!.role === "owner" && session!.accountRole === "worker") {
    throw new Error("No autorizado para gestionar este negocio.");
  }
}

/** Para operaciones que solo RYVO puede hacer (ej: crear un negocio nuevo). */
export async function requireSuperAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session || session.role !== "super") {
    throw new Error("No autorizado.");
  }
}

export type BusinessMemberAccess =
  | { scope: "full" }
  | { scope: "worker"; professionalId: string };

/**
 * Para las Server Actions que SÍ puede llamar una cuenta "worker" del
 * Editor rápido (perfil propio, servicios asignados, galería, catálogo) —
 * dueño/admin/superadmin siguen entrando sin restricción adicional
 * (`scope: "full"`). El `professionalId` devuelto sale de la sesión
 * firmada, nunca de un parámetro de la request — cada acción que lo usa
 * debe comparar contra el recurso puntual que está tocando (ver
 * adminUpdateProfessional/adminUpdateService, por ejemplo) para que
 * manipular un id a mano en la request nunca alcance para tocar el
 * recurso de otro profesional.
 */
export async function requireBusinessMember(
  businessId: string
): Promise<BusinessMemberAccess> {
  const session = await getAdminSession();
  if (!canManageBusiness(session, businessId)) {
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
