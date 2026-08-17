import { canManageBusiness, getAdminSession } from "@/lib/admin/session";

/**
 * Punto único de autorización para las server actions del admin. Antes de
 * este archivo, cada acción solo chequeaba "¿hay alguna sesión de admin
 * válida?" sin verificar a qué negocio pertenecía — cualquier sesión podía
 * tocar cualquier negocio. Ahora cada acción que recibe un `businessId`
 * debe pasar por acá primero.
 */
export async function requireAdminFor(businessId: string): Promise<void> {
  const session = await getAdminSession();
  if (!canManageBusiness(session, businessId)) {
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
