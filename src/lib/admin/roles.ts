import { AccountRole } from "@/types/business";

/**
 * Capacidades por rol dentro de un negocio (dueño/administrador/
 * trabajador) — estructura para cuando se construya gestión de equipo,
 * sin tener que rediseñar sesión ni el menú de administración. Hoy no la
 * llama nada todavía: no existe ninguna forma de crear una cuenta que no
 * sea "owner", así que esto no tiene ningún efecto observable — es
 * puramente organización de código, no un sistema de permisos aplicado.
 * "*" = acceso total.
 */
export const ROLE_CAPABILITIES: Record<AccountRole, string[] | "*"> = {
  owner: "*",
  admin: ["editor", "turnos", "clientes", "estadisticas", "oportunidades", "cuenta"],
  worker: ["turnos", "clientes"],
};

export function roleCanAccess(role: AccountRole, capability: string): boolean {
  const allowed = ROLE_CAPABILITIES[role];
  return allowed === "*" || allowed.includes(capability);
}
