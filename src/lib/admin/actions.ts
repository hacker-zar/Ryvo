"use server";

import { revalidatePath } from "next/cache";
import { hasValidAdminSession } from "@/lib/admin/session";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import {
  BusinessInput,
  LocationInput,
  ServiceInput,
  createBusiness,
  createLocation,
  createService,
  deleteLocation,
  deleteService,
  updateBookingStatus,
  updateBusiness,
  updateLocation,
  updateService,
} from "@/lib/data/business-repository";
import { OpeningHours } from "@/types/business";

async function requireAdmin() {
  const ok = await hasValidAdminSession();
  if (!ok) throw new Error("No autorizado.");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function adminCreateBusiness(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const slugRaw = String(formData.get("slug") || "").trim();

  const input: BusinessInput = {
    name,
    slug: slugRaw ? slugify(slugRaw) : slugify(name),
    description: String(formData.get("description") || ""),
    logo: String(formData.get("logo") || ""),
    primary_color: String(formData.get("primary_color") || "#111111"),
    secondary_color: String(formData.get("secondary_color") || "#f5f5f5"),
    whatsapp: String(formData.get("whatsapp") || ""),
    instagram: String(formData.get("instagram") || ""),
    address: String(formData.get("address") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    city: String(formData.get("city") || ""),
    hero_image: String(formData.get("hero_image") || ""),
    gallery: [],
    opening_hours: [],
  };

  if (!input.name || !input.slug) {
    return { success: false, error: "Nombre y slug son obligatorios." };
  }

  const result = await createBusiness(input);
  if (result.success) revalidatePath("/admin");
  return result;
}

export async function adminUpdateBusiness(
  id: string,
  formData: FormData
) {
  await requireAdmin();

  const input: Partial<BusinessInput> = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    logo: String(formData.get("logo") || ""),
    primary_color: String(formData.get("primary_color") || "#111111"),
    secondary_color: String(formData.get("secondary_color") || "#f5f5f5"),
    whatsapp: String(formData.get("whatsapp") || ""),
    instagram: String(formData.get("instagram") || ""),
    address: String(formData.get("address") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    city: String(formData.get("city") || ""),
    hero_image: String(formData.get("hero_image") || ""),
  };

  const result = await updateBusiness(id, input);
  if (result.success) {
    revalidatePath("/admin");
    revalidatePath(`/admin/negocios/${id}`);
  }
  return result;
}

export async function adminCreateService(
  businessId: string,
  formData: FormData
) {
  await requireAdmin();

  const input: ServiceInput = {
    business_id: businessId,
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    duration: Number(formData.get("duration") || 30),
    active: formData.get("active") === "on",
  };

  if (!input.name) return { success: false, error: "El nombre es obligatorio." };

  const result = await createService(input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateService(
  businessId: string,
  serviceId: string,
  formData: FormData
) {
  await requireAdmin();

  const input: Partial<ServiceInput> = {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    duration: Number(formData.get("duration") || 30),
    active: formData.get("active") === "on",
  };

  const result = await updateService(serviceId, input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminDeleteService(
  businessId: string,
  serviceId: string
) {
  await requireAdmin();
  const result = await deleteService(serviceId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateBookingStatus(
  businessId: string,
  bookingId: string,
  status: "confirmed" | "cancelled"
) {
  await requireAdmin();
  const result = await updateBookingStatus(bookingId, status);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}/turnos`);
  return result;
}

/**
 * Parsea el horario semanal enviado desde el editor de locales. Se manda
 * como JSON en un campo hidden del form (armado en el cliente), porque es
 * una estructura de 7 filas — más simple que 7 campos sueltos por día.
 */
function parseOpeningHours(raw: string): OpeningHours[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function adminCreateLocation(
  businessId: string,
  formData: FormData
) {
  await requireAdmin();

  const input: LocationInput = {
    business_id: businessId,
    name: String(formData.get("name") || "").trim(),
    address: String(formData.get("address") || ""),
    opening_hours: parseOpeningHours(
      String(formData.get("opening_hours") || "[]")
    ),
    is_primary: formData.get("is_primary") === "on",
  };

  if (!input.name) return { success: false, error: "El nombre es obligatorio." };

  const result = await createLocation(input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateLocation(
  businessId: string,
  locationId: string,
  formData: FormData
) {
  await requireAdmin();

  const input: Partial<LocationInput> = {
    name: String(formData.get("name") || "").trim(),
    address: String(formData.get("address") || ""),
    opening_hours: parseOpeningHours(
      String(formData.get("opening_hours") || "[]")
    ),
    is_primary: formData.get("is_primary") === "on",
  };

  const result = await updateLocation(locationId, input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminDeleteLocation(
  businessId: string,
  locationId: string
) {
  await requireAdmin();
  const result = await deleteLocation(locationId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

const TYPOGRAPHY_PRESETS = new Set(["clasica", "moderna", "elegante"]);
const BUTTON_STYLES = new Set(["redondeado", "suave", "recto"]);

export async function adminUpdateAppearance(
  businessId: string,
  formData: FormData
) {
  await requireAdmin();

  const typography = String(formData.get("typography_preset") || "elegante");
  const buttonStyle = String(formData.get("button_style") || "recto");

  const input: Partial<BusinessInput> = {
    primary_color: String(formData.get("primary_color") || "#c9a15a"),
    secondary_color: String(formData.get("secondary_color") || "#f5f5f5"),
    background_color: String(formData.get("background_color") || "#1a1815"),
    text_color: String(formData.get("text_color") || "#f7f4ee"),
    typography_preset: TYPOGRAPHY_PRESETS.has(typography)
      ? (typography as BusinessInput["typography_preset"])
      : "elegante",
    button_style: BUTTON_STYLES.has(buttonStyle)
      ? (buttonStyle as BusinessInput["button_style"])
      : "recto",
  };

  const result = await updateBusiness(businessId, input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sube una imagen (logo, portada o foto de galería) a Supabase Storage y
 * devuelve su URL pública, para usar en los campos correspondientes del
 * negocio sin que el usuario tenga que pegar una URL a mano.
 *
 * `folder` agrupa las imágenes por negocio dentro del bucket. Al crear un
 * negocio nuevo (que todavía no tiene id), se usa "new" como carpeta
 * temporal — el archivo ya queda subido y con URL pública utilizable
 * igual, aunque no esté bajo el id definitivo del negocio.
 */
export async function adminUploadImage(
  folder: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdmin();

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder subir imágenes.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No se recibió ningún archivo." };
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Formato no soportado. Usá JPG, PNG, WEBP, GIF o SVG.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "La imagen no puede pesar más de 5 MB." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "") || "new";
  const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from("business-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { success: false, error: error.message };

  const { data } = supabaseAdmin.storage
    .from("business-images")
    .getPublicUrl(path);

  return { success: true, url: data.publicUrl };
}
