"use server";

import { redirect } from "next/navigation";
import { hashPassword, createOwnerSession } from "@/lib/admin/session";
import { createAccount, isUsernameTaken } from "@/lib/data/accounts-repository";
import {
  createBusiness,
  BusinessInput,
  getOfficialTemplateById,
} from "@/lib/data/business-repository";
import { sanitizeSectionOrder } from "@/lib/section-order";
import { slugify, dedupeSlug } from "@/lib/slug";

const BUSINESS_TYPES = new Set([
  "peluqueria",
  "barberia",
  "estilista",
  "otro",
]);

/**
 * Único punto de entrada de todo el feature sin sesión previa que
 * verificar — es el registro self-service (landing → "Quiero mi web").
 * A diferencia de adminCreateBusiness (exclusivo del superadmin, ver
 * actions.ts), cualquier visitante puede llamarla. Lo que la mantiene
 * segura pese a no tener requireAdminFor/requireSuperAdmin: el
 * businessId con el que termina la sesión es el que devuelve
 * createBusiness (generado acá, nunca el que mande el cliente) — es
 * estructuralmente imposible que esta acción toque un negocio que no
 * acaba de crear ella misma.
 *
 * Crea negocio y cuenta juntos (mismo orden que adminCreateBusiness): esta
 * cuenta siempre queda con `business_id` seteado (role "owner", nunca
 * "partner" — ver Account.business_id en types/business.ts), así que no
 * puede existir antes que el negocio. Termina autenticado
 * (createOwnerSession) y redirige directo al negocio recién creado — sin
 * volver a pasar por login.
 */
export async function registerBusiness(formData: FormData) {
  const ownerName = String(formData.get("owner_name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("business_name") || "").trim();
  const businessTypeRaw = String(formData.get("business_type") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();

  if (!ownerName || !email || !password) {
    return {
      success: false,
      error: "Nombre, email y contraseña son obligatorios.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Ingresá un email válido." };
  }
  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }
  if (!businessName) {
    return { success: false, error: "El nombre del negocio es obligatorio." };
  }
  if (await isUsernameTaken(email)) {
    return { success: false, error: "Ya existe una cuenta con ese email." };
  }

  const businessType = BUSINESS_TYPES.has(businessTypeRaw)
    ? businessTypeRaw
    : "otro";
  const slug = await dedupeSlug(slugify(businessName));

  // Plantilla elegida en el paso 1 del wizard — "" o cualquier id que no
  // resuelva a una oficial (nunca debería pasar desde la UI, pero un
  // FormData es manipulable) cae en "Página en blanco": el negocio nace
  // sin template_id/template_layout/palette_id, exactamente como
  // cualquier negocio sin plantilla (ver Template en types/business.ts).
  const templateId = String(formData.get("template_id") || "").trim();
  const template = templateId ? await getOfficialTemplateById(templateId) : null;

  const input: BusinessInput = {
    name: businessName,
    slug,
    description: "",
    logo: "",
    primary_color: "#c9a15a",
    secondary_color: "#f5f5f5",
    whatsapp,
    instagram: "",
    address: "",
    phone: "",
    email: "",
    city,
    hero_image: "",
    gallery: [],
    opening_hours: [],
    business_type: businessType,
    onboarding_step: 0,
    published: false,
    ...(template
      ? {
          template_id: template.id,
          template_layout: template.layout,
          palette_id: template.palette_id,
          button_style: template.button_style,
          animation_preset: template.animation_preset,
          section_order: sanitizeSectionOrder(template.section_order),
        }
      : {}),
  };

  const businessResult = await createBusiness(input);
  if (!businessResult.success || !businessResult.id) {
    return {
      success: false,
      error: businessResult.error ?? "No se pudo crear el negocio.",
    };
  }

  const passwordHash = await hashPassword(password);
  const accountResult = await createAccount({
    business_id: businessResult.id,
    name: ownerName,
    username: email,
    password_hash: passwordHash,
  });

  if (!accountResult.success || !accountResult.id) {
    // El negocio ya existe pero sin cuenta — mismo caso ya contemplado
    // por adminCreateBusiness: se puede crear la cuenta después desde
    // "Cuenta" en el panel. Acá, sin sesión todavía, no hay forma de
    // llevar al usuario ahí, así que devolvemos un error claro.
    return {
      success: false,
      error:
        accountResult.error ??
        "El negocio se creó pero no se pudo crear la cuenta. Contactanos.",
    };
  }

  await createOwnerSession(accountResult.id, businessResult.id);
  redirect(`/admin/negocios/${businessResult.id}`);
}
