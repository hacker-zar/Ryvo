"use server";

import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  clearAdminOrigin,
  createAdminSession,
  destroyAdminSession,
  getAdminOrigin,
} from "@/lib/admin/session";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (!process.env.ADMIN_PASSWORD) {
    return {
      success: false,
      error:
        "ADMIN_PASSWORD no está configurada. Definila en las variables de entorno.",
    };
  }

  if (!checkAdminPassword(password)) {
    return { success: false, error: "Contraseña incorrecta." };
  }

  await createAdminSession();
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
