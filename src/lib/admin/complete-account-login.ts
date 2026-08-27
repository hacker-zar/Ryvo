import { redirect } from "next/navigation";
import { AccountRole } from "@/types/business";
import { createOwnerSession, createPartnerSession } from "@/lib/admin/session";

interface AuthenticatedAccount {
  id: string;
  business_id: string | null;
  role: AccountRole;
  professional_id: string | null;
}

/**
 * Emite la sesión + redirige según el rol de una cuenta YA autenticada
 * (usuario/contraseña o Google, no importa cuál). Deliberadamente NO
 * lleva "use server": cualquier función exportada de un archivo con
 * "use server" queda invocable como endpoint independiente con cualquier
 * argumento que alguien decida mandar, sin importar si algún componente la
 * llama hoy. Al vivir en un módulo plano, esto solo se ejecuta como parte
 * de una Server Action que ya verificó la identidad antes de llamarlo
 * (loginAdmin, loginAdminWithGoogle) — nunca queda expuesto por su cuenta.
 */
export async function completeAccountLogin(
  account: AuthenticatedAccount
): Promise<never> {
  // Una cuenta "partner" no tiene un único negocio (business_id null) —
  // aterriza en /admin, que para sesión "partner" lista solo sus negocios
  // asignados. Distinto de "worker" (Barber) y "owner", que sí están
  // atadas a un business_id.
  if (account.role === "partner") {
    await createPartnerSession(account.id);
    redirect("/admin");
  }

  await createOwnerSession(
    account.id,
    account.business_id!,
    account.role,
    account.professional_id
  );
  // Ninguna cuenta "owner" (dueño o Barber) aterriza en el editor completo
  // — es exclusivo de super/partner. Owner y Barber van los dos a
  // /rapido; lo que ven ahí adentro difiere por rol.
  redirect(`/admin/negocios/${account.business_id}/rapido`);
}
