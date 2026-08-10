"use server";

import { revalidatePath } from "next/cache";
import { hasValidAdminSession } from "@/lib/admin/session";
import {
  BusinessInput,
  ServiceInput,
  createBusiness,
  createService,
  deleteService,
  updateBusiness,
  updateService,
} from "@/lib/data/business-repository";

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
