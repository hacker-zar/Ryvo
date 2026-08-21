"use server";

import { revalidatePath } from "next/cache";
import { requireAdminFor, requireBusinessMember, requireSuperAdmin } from "@/lib/admin/authorize";
import { hashPassword } from "@/lib/admin/session";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import {
  BusinessInput,
  LocationInput,
  ProductInput,
  ProfessionalInput,
  ServiceInput,
  TemplateInput,
  countBusinessesUsingTemplate,
  createBusiness,
  createLocation,
  createProduct,
  createProfessional,
  createService,
  createTemplate,
  deleteLocation,
  deleteProduct,
  deleteProfessional,
  deleteService,
  deleteTemplate,
  getBusinessById,
  getOfficialTemplateById,
  getTemplateById,
  isProfessionalQualifiedForService,
  listProfessionalsByBusiness,
  reorderProfessional,
  updateBookingStatus,
  updateBusiness,
  updateClientNotes,
  updateLocation,
  updateProduct,
  updateProfessional,
  updateService,
} from "@/lib/data/business-repository";
import {
  createAccount,
  isUsernameTaken,
  updateAccount,
  updateAccountPassword,
} from "@/lib/data/accounts-repository";
import { AccountRole, OpeningHours, SectionConfig } from "@/types/business";
import { slugify } from "@/lib/slug";
import { sanitizeSectionOrder } from "@/lib/section-order";

/**
 * Crear negocios nuevos es exclusivo de RYVO (superadmin) — un dueño no
 * debería poder crear otros negocios desde su propia sesión.
 *
 * Crea el negocio Y la cuenta inicial del propietario juntas: sin cuenta,
 * el negocio queda sin forma de que su dueño entre al editor. Si el
 * negocio se crea pero la cuenta falla (ej: usuario duplicado en una
 * carrera), no revertimos el negocio — devolvemos un error que lo deja en
 * claro, y la cuenta se puede crear después desde la página del negocio
 * (sección "Cuenta"), que ya contempla el caso de negocio sin cuenta.
 */
export async function adminCreateBusiness(formData: FormData) {
  await requireSuperAdmin();

  const name = String(formData.get("name") || "").trim();
  const slugRaw = String(formData.get("slug") || "").trim();
  const ownerName = String(formData.get("owner_name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  // Plantilla elegida en el formulario (sección "Plantilla", vía
  // TemplatePicker) — mismo criterio que registerBusiness: solo
  // oficiales resuelven acá (el negocio todavía no existe, así que no
  // puede tener "Mis plantillas" propias todavía), "" cae en blanco.
  const templateId = String(formData.get("template_id") || "").trim();
  const template = templateId ? await getOfficialTemplateById(templateId) : null;

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

  if (!input.name || !input.slug) {
    return { success: false, error: "Nombre y slug son obligatorios." };
  }
  if (!ownerName || !username || !password) {
    return {
      success: false,
      error: "Nombre, usuario y contraseña del propietario son obligatorios.",
    };
  }
  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }
  if (await isUsernameTaken(username)) {
    return { success: false, error: "Ese usuario ya está en uso." };
  }

  const businessResult = await createBusiness(input);
  if (!businessResult.success || !businessResult.id) return businessResult;

  const passwordHash = await hashPassword(password);
  const accountResult = await createAccount({
    business_id: businessResult.id,
    name: ownerName,
    username,
    password_hash: passwordHash,
  });

  revalidatePath("/admin");

  if (!accountResult.success) {
    return {
      success: false,
      id: businessResult.id,
      error: `El negocio se creó, pero la cuenta no: ${accountResult.error} Podés crearla desde la página del negocio.`,
    };
  }

  return businessResult;
}

// Campos de `businesses` que puede tocar esta acción, y a qué clave de
// FormData corresponde cada uno (todas coinciden con el nombre de campo
// menos por claridad de lectura). Deliberadamente NO incluye
// primary_color/secondary_color: esos son de adminUpdateAppearance.
const UPDATABLE_BUSINESS_FIELDS = [
  "name",
  "description",
  "logo",
  "whatsapp",
  "instagram",
  "address",
  "phone",
  "email",
  "city",
  "hero_image",
  "about_image",
  "favicon",
  "hero_video",
] as const;

const HERO_VIDEO_POSITIONS = new Set(["center", "top", "bottom"]);

/**
 * El editor ahora manda cada categoría (Información, Fotos, ...) como un
 * form separado, cada uno con solo SUS campos. Por eso el input se arma
 * solo con las claves que efectivamente vinieron en el FormData
 * (`formData.has`) — si armáramos el objeto completo con "" para lo
 * ausente (como antes), guardar un panel borraría los campos del otro,
 * porque `updateBusiness` hace un `.update()` real con lo que reciba.
 */
export async function adminUpdateBusiness(id: string, formData: FormData) {
  await requireAdminFor(id);

  const input: Partial<BusinessInput> = {};
  for (const field of UPDATABLE_BUSINESS_FIELDS) {
    if (formData.has(field)) {
      input[field] = String(formData.get(field) || "");
    }
  }

  // hero_video_enabled es un checkbox: si no está marcado, FormData
  // directamente lo omite — no hay forma de distinguir "este form no se
  // envió" de "se envió con el checkbox destildado" solo mirando
  // formData.has("hero_video_enabled"). Se usa hero_video_position (un
  // <select>, siempre presente cuando el form de fotos-panel.tsx se
  // envía) como gate en su lugar — mismo criterio que ya usa
  // adminUpdateAppearance para validar presets contra un allow-list.
  if (formData.has("hero_video_position")) {
    const position = String(formData.get("hero_video_position") || "center");
    input.hero_video_position = HERO_VIDEO_POSITIONS.has(position)
      ? (position as BusinessInput["hero_video_position"])
      : "center";
    input.hero_video_enabled = formData.get("hero_video_enabled") === "on";
  }

  if ("name" in input && !input.name?.trim()) {
    return { success: false, error: "El nombre es obligatorio." };
  }

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
  await requireAdminFor(businessId);

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
  // requireBusinessMember (no requireAdminFor): una cuenta "worker"
  // (Editor rápido) puede editar un servicio, pero SOLO si está
  // calificada para él — se verifica contra professional_services acá
  // abajo, nunca confiando en qué le mostró la UI. Crear/borrar
  // servicios sigue siendo exclusivo de dueño/admin (ver
  // adminCreateService/adminDeleteService, que no cambiaron).
  const access = await requireBusinessMember(businessId);
  if (access.scope === "worker") {
    const qualified = await isProfessionalQualifiedForService(
      access.professionalId,
      serviceId
    );
    if (!qualified) {
      throw new Error("No autorizado para editar este servicio.");
    }
  }

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
  await requireAdminFor(businessId);
  const result = await deleteService(serviceId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

// Catálogo: recurso COMPARTIDO del negocio (no hay noción de "producto de
// tal profesional" en el modelo, confirmado antes de construir el Editor
// rápido) — cualquier cuenta que pueda gestionar el negocio, dueño o
// profesional, tiene el mismo poder sobre él. requireBusinessMember en
// vez de requireAdminFor, sin chequeo adicional en la rama "worker".

export async function adminCreateProduct(
  businessId: string,
  formData: FormData
) {
  await requireBusinessMember(businessId);

  const input: ProductInput = {
    business_id: businessId,
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    image: String(formData.get("image") || ""),
    active: formData.get("active") === "on",
  };

  if (!input.name) return { success: false, error: "El nombre es obligatorio." };

  const result = await createProduct(input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateProduct(
  businessId: string,
  productId: string,
  formData: FormData
) {
  await requireBusinessMember(businessId);

  const input: Partial<ProductInput> = {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    image: String(formData.get("image") || ""),
    active: formData.get("active") === "on",
  };

  const result = await updateProduct(productId, input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminDeleteProduct(
  businessId: string,
  productId: string
) {
  await requireAdminFor(businessId);
  const result = await deleteProduct(productId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminCreateProfessional(
  businessId: string,
  formData: FormData
) {
  await requireAdminFor(businessId);

  const input: ProfessionalInput = {
    business_id: businessId,
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || ""),
    bio: String(formData.get("bio") || ""),
    photo: String(formData.get("photo") || ""),
    experience: String(formData.get("experience") || ""),
    active: formData.get("active") === "on",
  };
  const serviceIds = formData.getAll("service_ids").map(String);

  if (!input.name) return { success: false, error: "El nombre es obligatorio." };

  const result = await createProfessional(input, serviceIds);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateProfessional(
  businessId: string,
  professionalId: string,
  formData: FormData
) {
  // requireBusinessMember: una cuenta "worker" (Editor rápido, "Mi
  // perfil") solo puede editarse a SÍ MISMA — el id de sesión, nunca el
  // que mande la request, decide si coincide con `professionalId`.
  const access = await requireBusinessMember(businessId);
  if (access.scope === "worker" && access.professionalId !== professionalId) {
    throw new Error("No autorizado para editar este profesional.");
  }

  const input: Partial<ProfessionalInput> = {
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || ""),
    bio: String(formData.get("bio") || ""),
    photo: String(formData.get("photo") || ""),
    experience: String(formData.get("experience") || ""),
    active: formData.get("active") === "on",
  };

  // Ojo acá: `formData.getAll("service_ids")` da `[]` (no `undefined`)
  // cuando el form no tiene esos checkboxes — y `updateProfessional`
  // trata cualquier array, incluso vacío, como "reemplazar las
  // asignaciones". Antes esto nunca se notaba porque el único form que
  // llamaba a esta acción (ProfessionalsManager, dueño) siempre los
  // manda. "Mi perfil" (Editor rápido) no los muestra a propósito —
  // asignar especialidades queda exclusivo del dueño, ver el plan — así
  // que acá se gatea por `formData.has(...)` para no borrar
  // silenciosamente las asignaciones de un profesional que edita su
  // propio perfil, y nunca se tocan en absoluto si la sesión es "worker".
  const serviceIds =
    access.scope === "full" && formData.has("service_ids_present")
      ? formData.getAll("service_ids").map(String)
      : undefined;

  const result = await updateProfessional(professionalId, input, serviceIds);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminDeleteProfessional(
  businessId: string,
  professionalId: string
) {
  await requireAdminFor(businessId);
  const result = await deleteProfessional(professionalId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminReorderProfessional(
  businessId: string,
  professionalId: string,
  direction: "up" | "down"
) {
  await requireAdminFor(businessId);
  const result = await reorderProfessional(businessId, professionalId, direction);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

// Argumento tipado directo, sin FormData — no vive dentro de ningún
// <form> compartido, se persiste al instante en cada drag/click de
// flecha/toggle, igual que adminReorderProfessional.
export async function adminUpdateSectionOrder(
  businessId: string,
  order: SectionConfig[]
) {
  await requireAdminFor(businessId);
  const result = await updateBusiness(businessId, {
    section_order: sanitizeSectionOrder(order),
  });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

// Argumento tipado directo, sin FormData — mismo criterio que
// adminUpdateSectionOrder: no vive dentro de ningún <form> compartido,
// se persiste al instante en cada click del toggle.
export async function adminSetSingleSpecialistMode(
  businessId: string,
  enabled: boolean
) {
  await requireAdminFor(businessId);
  const result = await updateBusiness(businessId, {
    single_specialist_mode: enabled,
  });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminUpdateBookingStatus(
  businessId: string,
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled" | "no_show"
) {
  await requireAdminFor(businessId);
  const result = await updateBookingStatus(bookingId, status);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}/turnos`);
  return result;
}

export async function adminUpdateClientNotes(
  businessId: string,
  clientId: string,
  formData: FormData
) {
  await requireAdminFor(businessId);
  const notes = String(formData.get("notes") || "");
  const result = await updateClientNotes(clientId, notes);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}/clientes/${clientId}`);
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
  await requireAdminFor(businessId);

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
  await requireAdminFor(businessId);

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
  await requireAdminFor(businessId);
  const result = await deleteLocation(locationId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

const TYPOGRAPHY_PRESETS = new Set(["clasica", "moderna", "elegante"]);
const BUTTON_STYLES = new Set(["redondeado", "suave", "recto"]);
const ANIMATION_PRESETS = new Set(["ninguna", "sutil", "dinamica"]);

export async function adminUpdateAppearance(
  businessId: string,
  formData: FormData
) {
  await requireAdminFor(businessId);

  const typography = String(formData.get("typography_preset") || "elegante");
  const buttonStyle = String(formData.get("button_style") || "recto");
  const animation = String(formData.get("animation_preset") || "sutil");

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
    animation_preset: ANIMATION_PRESETS.has(animation)
      ? (animation as BusinessInput["animation_preset"])
      : "sutil",
  };

  const result = await updateBusiness(businessId, input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/**
 * Crea la cuenta de acceso de un negocio que todavía no tiene ninguna
 * (caso raro hoy: negocios creados antes de este sistema, o si la
 * creación automática al crear el negocio falló). El superadmin puede
 * hacerlo para cualquier negocio; el dueño solo para el suyo —
 * requireAdminFor ya cubre ambos casos.
 */
const ACCOUNT_ROLES = new Set<AccountRole>(["owner", "admin", "worker"]);

/**
 * "worker" es una cuenta de Editor rápido — vinculada a UN profesional
 * puntual del negocio (ver requireBusinessMember en authorize.ts). Se
 * exige `professional_id` y se verifica que ese id pertenezca de verdad
 * a ESTE negocio (nunca confiar en el id que mande el formulario sin
 * chequearlo) antes de crear la cuenta.
 */
export async function adminCreateAccount(businessId: string, formData: FormData) {
  await requireAdminFor(businessId);

  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const roleRaw = String(formData.get("role") || "owner");
  const role = ACCOUNT_ROLES.has(roleRaw as AccountRole)
    ? (roleRaw as AccountRole)
    : "owner";
  const professionalId = String(formData.get("professional_id") || "").trim();

  if (!name || !username || !password) {
    return {
      success: false,
      error: "Nombre, usuario y contraseña son obligatorios.",
    };
  }
  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }
  if (await isUsernameTaken(username)) {
    return { success: false, error: "Ese usuario ya está en uso." };
  }

  if (role === "worker") {
    if (!professionalId) {
      return {
        success: false,
        error: "Elegí a qué profesional se vincula esta cuenta.",
      };
    }
    const professionals = await listProfessionalsByBusiness(businessId);
    if (!professionals.some((p) => p.id === professionalId)) {
      return {
        success: false,
        error: "Ese profesional no pertenece a este negocio.",
      };
    }
  }

  const passwordHash = await hashPassword(password);
  const result = await createAccount({
    business_id: businessId,
    name,
    username,
    password_hash: passwordHash,
    role,
    professional_id: role === "worker" ? professionalId : null,
  });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/** Cambia nombre/usuario/estado de una cuenta existente (no la contraseña
 *  — ver adminChangeAccountPassword para eso). */
export async function adminUpdateAccount(
  businessId: string,
  accountId: string,
  formData: FormData
) {
  await requireAdminFor(businessId);

  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const active = formData.get("active") === "on";

  if (!name || !username) {
    return { success: false, error: "Nombre y usuario son obligatorios." };
  }

  const result = await updateAccount(accountId, { name, username, active });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

export async function adminChangeAccountPassword(
  businessId: string,
  accountId: string,
  formData: FormData
) {
  await requireAdminFor(businessId);

  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const passwordHash = await hashPassword(password);
  const result = await updateAccountPassword(accountId, passwordHash);
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
 * temporal — solo el superadmin pasa por ese caso, porque solo el
 * superadmin puede crear negocios.
 */
export async function adminUploadImage(
  folder: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (folder === "new") {
    await requireSuperAdmin();
  } else {
    // requireBusinessMember (no requireAdminFor): subir un archivo no
    // toca ninguna fila puntual — lo usan tanto ImageUploadField/
    // GalleryUploadField del editor completo como los mismos
    // componentes reutilizados en el Editor rápido (foto de perfil,
    // galería). No hace falta distinguir "worker" acá adentro.
    await requireBusinessMember(folder);
  }

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

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB — clip corto sin audio, no un video largo

/**
 * Sube el video de fondo del hero a Supabase Storage. Mismo bucket que
 * las imágenes (business-images, sin restricción de MIME a nivel bucket)
 * y misma convención de path — no hace falta un bucket nuevo.
 */
export async function adminUploadVideo(
  folder: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdminFor(folder);

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder subir videos.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No se recibió ningún archivo." };
  }

  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Formato no soportado. Usá MP4 o WEBM.",
    };
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return { success: false, error: "El video no puede pesar más de 15 MB." };
  }

  const extension = file.name.split(".").pop() || "mp4";
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

/**
 * Guarda en qué paso del onboarding self-service quedó el negocio, para
 * poder retomarlo donde lo dejó si vuelve más tarde (ver
 * OnboardingChrome). No valida el rango del paso — es solo un puntero de
 * navegación, no un gate de seguridad.
 */
export async function adminSetOnboardingStep(businessId: string, step: number) {
  await requireAdminFor(businessId);
  return updateBusiness(businessId, { onboarding_step: step });
}

/**
 * Hace público el negocio en /[slug] — último paso del onboarding
 * self-service ("Publicar mi web"). Los negocios creados por el
 * superadmin (adminCreateBusiness) ya nacen publicados y nunca necesitan
 * esta acción.
 */
export async function adminPublishBusiness(businessId: string) {
  await requireAdminFor(businessId);
  const result = await updateBusiness(businessId, {
    published: true,
    onboarding_step: 5,
  });
  if (result.success) {
    revalidatePath("/admin");
    revalidatePath(`/admin/negocios/${businessId}`);
  }
  return result;
}

// ---------------------------------------------------------------------
// Sistema de plantillas — gestión desde el editor ("Plantilla" al final
// de CATEGORIES) y desde el picker de creación de página. Ver Template en
// types/business.ts para el principio rector: la plantilla es una CAPA DE
// DISEÑO, nunca contenido — ninguna de estas acciones toca nombre,
// servicios, profesionales, fotos, horarios, contacto ni reservas.
// ---------------------------------------------------------------------

/**
 * Aplica una plantilla (oficial o propia) al negocio: copia su diseño
 * completo (layout, paleta, estilo de botón, preset de animación, orden
 * por defecto de secciones) a `businesses`. Es una copia, no una
 * referencia viva — si la plantilla de origen se borra después, la
 * página del negocio sigue renderizando exactamente igual (ver
 * `template_id` con `on delete set null` en la migración).
 */
export async function adminApplyTemplate(businessId: string, templateId: string) {
  await requireAdminFor(businessId);

  const template = await getTemplateById(templateId);
  if (!template) return { success: false, error: "Plantilla no encontrada." };

  const result = await updateBusiness(businessId, {
    template_id: template.id,
    template_layout: template.layout,
    palette_id: template.palette_id,
    button_style: template.button_style,
    animation_preset: template.animation_preset,
    section_order: sanitizeSectionOrder(template.section_order),
  });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/**
 * Guarda el diseño ACTUAL del negocio como una plantilla propia nueva
 * ("Guardar como nueva" en el editor). Si el negocio nunca eligió
 * plantilla todavía, usa "studio"/"obsidian" como punto de partida
 * razonable — son solo los valores iniciales de la plantilla nueva, no
 * afectan al negocio en sí.
 */
export async function adminCreateTemplate(businessId: string, formData: FormData) {
  await requireAdminFor(businessId);

  const name = String(formData.get("name") || "").trim();
  if (!name) return { success: false, error: "El nombre es obligatorio." };
  const description = String(formData.get("description") || "");

  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Negocio no encontrado." };

  const input: TemplateInput = {
    business_id: businessId,
    slug: null,
    name,
    description,
    is_official: false,
    layout: business.template_layout ?? "studio",
    palette_id: business.palette_id ?? "obsidian",
    button_style: business.button_style ?? "recto",
    animation_preset: business.animation_preset ?? "sutil",
    section_order: sanitizeSectionOrder(business.section_order),
  };

  const result = await createTemplate(input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/**
 * Duplica cualquier plantilla (oficial o propia de otro momento) en una
 * copia propia del negocio — fila nueva, sin ninguna referencia a la de
 * origen, así que modificarla después nunca toca la original.
 */
export async function adminDuplicateTemplate(
  businessId: string,
  sourceTemplateId: string
) {
  await requireAdminFor(businessId);

  const source = await getTemplateById(sourceTemplateId);
  if (!source) return { success: false, error: "Plantilla no encontrada." };

  const input: TemplateInput = {
    business_id: businessId,
    slug: null,
    name: `${source.name} — Mi versión`,
    description: source.description,
    is_official: false,
    layout: source.layout,
    palette_id: source.palette_id,
    button_style: source.button_style,
    animation_preset: source.animation_preset,
    section_order: source.section_order,
  };

  const result = await createTemplate(input);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/**
 * Borra una plantilla PROPIA del negocio. Nunca una oficial de RYVO —
 * validado acá server-side (no solo ocultando el botón en la UI). Si
 * algún negocio la tiene aplicada ahora mismo, el `on delete set null` de
 * la FK deja su `template_id` en null sin tocar `template_layout`/
 * `palette_id`/etc. (ya copiados en su momento) — la página sigue
 * funcionando con su diseño actual, no se rompe.
 */
export async function adminDeleteTemplate(businessId: string, templateId: string) {
  await requireAdminFor(businessId);

  const template = await getTemplateById(templateId);
  if (!template) return { success: false, error: "Plantilla no encontrada." };
  if (template.is_official) {
    return {
      success: false,
      error: "Las plantillas oficiales de RYVO no se pueden eliminar.",
    };
  }
  if (template.business_id !== businessId) {
    return { success: false, error: "Esta plantilla no pertenece a este negocio." };
  }

  const result = await deleteTemplate(templateId);
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/** Vuelve a "Página en blanco" — no es aplicar una plantilla, es quitar
 *  la que estuviera puesta. Deja intactos button_style/animation_preset/
 *  section_order tal como estén: sin plantilla, esos campos vuelven a
 *  ser simplemente la configuración propia del negocio (mismo
 *  comportamiento que un negocio que nunca eligió plantilla). */
export async function adminClearTemplate(businessId: string) {
  await requireAdminFor(businessId);
  const result = await updateBusiness(businessId, {
    template_id: null,
    template_layout: null,
    palette_id: null,
  });
  if (result.success) revalidatePath(`/admin/negocios/${businessId}`);
  return result;
}

/** Cuántos negocios tienen esta plantilla aplicada ahora mismo — la UI lo
 *  pide antes de confirmar un borrado, para avisar el impacto (ver
 *  adminDeleteTemplate: el borrado en sí nunca rompe esas páginas, esto
 *  es solo informativo). */
export async function adminGetTemplateUsageCount(
  businessId: string,
  templateId: string
) {
  await requireAdminFor(businessId);
  return countBusinessesUsingTemplate(templateId);
}
