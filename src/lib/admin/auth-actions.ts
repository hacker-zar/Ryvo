"use server";

import { redirect } from "next/navigation";
import {
  checkSuperAdminPassword,
  clearAdminOrigin,
  createOwnerSession,
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

    await createOwnerSession(account.id, account.business_id);
    redirect(`/admin/negocios/${account.business_id}`);
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
