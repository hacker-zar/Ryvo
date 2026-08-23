"use server";

import { redirect } from "next/navigation";
import {
  checkSuperAdminPassword,
  clearAdminOrigin,
  createOwnerSession,
  createPartnerSession,
  createSuperAdminSession,
  destroyAdminSession,
  getAdminOrigin,
  verifyPassword,
} from "@/lib/admin/session";
import { getAccountAuthByUsername } from "@/lib/data/accounts-repository";

// Mensaje único para cualquier fallo de login de cuenta (usuario
// inexistente, contraseña incorrecta, o cuenta desactivada). Adrede: si
// cada caso tuviera su propio mensaje, alguien podría usarlo para
// averiguar qué usuarios existen o cuáles están desactivados.
const ACCOUNT_LOGIN_ERROR = "Usuario o contraseña incorrectos.";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  // Login de cuenta (dueño de un negocio): viene con "username" en el form.
  // El negocio se determina en el server a partir de la cuenta encontrada
  // (accounts.business_id) — nunca de algo que mande el cliente.
  if (username) {
    const account = await getAccountAuthByUsername(username);
    if (!account || !account.active) {
      return { success: false, error: ACCOUNT_LOGIN_ERROR };
    }

    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) {
      return { success: false, error: ACCOUNT_LOGIN_ERROR };
    }

    // Una cuenta "partner" no tiene un único negocio (business_id null) —
    // aterriza en /admin, que para sesión "partner" lista solo sus
    // negocios asignados (ver admin/page.tsx). Distinto de "worker"
    // (Barber) y "owner", que sí están atadas a un business_id.
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
    // Ninguna cuenta "owner" (dueño o Barber, accountRole "owner"/"worker")
    // aterriza en el editor completo — es exclusivo de super/partner (ver
    // require-full-editor-access.ts). Owner y Barber van los dos a
    // /rapido; lo que ven ahí adentro difiere por rol (Cambios rápidos vs.
    // Mis turnos, ver rapido/page.tsx), pero la URL de entrada es la misma.
    redirect(`/admin/negocios/${account.business_id}/rapido`);
  }

  // Sin username: login de superadmin (RYVO), independiente del sistema de
  // cuentas, contra ADMIN_PASSWORD.
  if (!process.env.ADMIN_PASSWORD) {
    return {
      success: false,
      error:
        "ADMIN_PASSWORD no está configurada. Definila en las variables de entorno.",
    };
  }

  if (!checkSuperAdminPassword(password)) {
    return { success: false, error: "Contraseña incorrecta." };
  }

  await createSuperAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  const origin = await getAdminOrigin();
  await destroyAdminSession();
  await clearAdminOrigin();
  // Vuelve a la página pública del negocio desde el que se entró al panel;
  // si no hay ese dato (ej: se entró directo por /admin/login), vuelve a
  // la home general en vez de a una ruta técnica.
  redirect(origin ? `/${origin}` : "/");
}
