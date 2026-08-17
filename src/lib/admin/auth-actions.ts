"use server";

import { redirect } from "next/navigation";
import {
  checkSuperAdminPassword,
  clearAdminOrigin,
  createOwnerSession,
  createSuperAdminSession,
  destroyAdminSession,
  getAdminOrigin,
  verifyBusinessPassword,
} from "@/lib/admin/session";
import { getBusinessAuthBySlug } from "@/lib/data/business-repository";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const businessSlug = String(formData.get("business_slug") || "").trim();

  // Login escopeado a UN negocio (vino de "¿Trabajás aquí?" en su sitio
  // público, o de /admin/login?business=<slug>). Se autentica contra la
  // contraseña propia de ese negocio, no contra ADMIN_PASSWORD.
  if (businessSlug) {
    const business = await getBusinessAuthBySlug(businessSlug);
    if (!business) {
      return { success: false, error: "No se encontró el negocio." };
    }
    if (!business.admin_password_hash) {
      return {
        success: false,
        error:
          "Este negocio todavía no tiene una contraseña de acceso asignada. Pedile a RYVO que te la configure.",
      };
    }
    const valid = await verifyBusinessPassword(
      password,
      business.admin_password_hash
    );
    if (!valid) {
      return { success: false, error: "Contraseña incorrecta." };
    }
    await createOwnerSession(business.id);
    redirect(`/admin/negocios/${business.id}`);
  }

  // Sin negocio puntual: login de superadmin (RYVO), contra ADMIN_PASSWORD.
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
