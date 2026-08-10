"use server";

import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
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
  await destroyAdminSession();
  redirect("/admin/login");
}
