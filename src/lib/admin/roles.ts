import { AccountRole } from "@/types/business";

/**
 * Capacidades por rol dentro de un negocio (dueño/Barber) — estructura
 * organizativa, sin efecto propio: la autorización real vive en
 * requireAdminFor/requireBusinessMember (authorize.ts), que no consultan
 * esto. "worker" (Barber) hoy solo ve sus propios turnos, de solo lectura
 * (ver getMyBookings en actions.ts) — "turnos" acá refleja eso, no un
 * permiso de escritura. "partner" no es un rol dentro de un negocio
 * puntual (administra el conjunto de negocios asignados, ver AdminSession
 * en session.ts) — mismo nivel que "owner" en cada uno de esos negocios.
 * "*" = acceso total.
 */
export const ROLE_CAPABILITIES: Record<AccountRole, string[] | "*"> = {
  owner: "*",
  worker: ["turnos"],
  partner: "*",
};

export function roleCanAccess(role: AccountRole, capability: string): boolean {
  const allowed = ROLE_CAPABILITIES[role];
  return allowed === "*" || allowed.includes(capability);
}
