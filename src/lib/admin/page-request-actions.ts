"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin/authorize";
import { adminCreateBusiness } from "@/lib/admin/actions";
import { updateBusiness } from "@/lib/data/business-repository";
import {
  claimPageRequestForConversion,
  linkPageRequestToBusiness,
  revertPageRequestClaim,
  updatePageRequestStatus,
} from "@/lib/data/page-requests-repository";
import { dedupeSlug, slugify } from "@/lib/slug";
import { PageRequestStatus } from "@/types/business";

export async function adminUpdatePageRequestStatus(
  id: string,
  status: PageRequestStatus
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const result = await updatePageRequestStatus(id, status);
  if (result.success) revalidatePath("/admin/solicitudes");
  return result;
}

/**
 * "Convertir en negocio" — exclusivo de superadmin (nunca partner, a
 * diferencia de adminCreateBusiness: convertir un lead de RYVO como
 * plataforma no es una operación que un Partner deba poder hacer).
 *
 * Reusa adminCreateBusiness tal cual — SIN tocarlo, para no afectar su
 * único otro call site (new-business-form.tsx, "Crear negocio" manual,
 * que sí debe seguir naciendo publicado). adminCreateBusiness no
 * expone forma de pedir `published: false` desde su FormData, así que
 * acá se corrige el negocio recién creado con un update aparte
 * (updateBusiness, ya genérico y reusado en todo el admin) — mismo
 * criterio que usa registerBusiness (registro self-service) para su
 * propio negocio: `published: false, onboarding_step: 0`. Sin ese
 * segundo campo, el negocio arrancaría el onboarding en el ÚLTIMO paso
 * (onboarding_step default = 5 en la base, el mismo valor con el que
 * adminPublishBusiness lo deja al publicar) en vez del primero — ver
 * OnboardingChrome.tsx, que calcula el paso inicial a partir de ese
 * campo. La UI de onboarding que dispara `business.published === false`
 * en (chrome)/page.tsx es la MISMA que usa el registro self-service
 * (mismos paneles reales, no una versión recortada) — es exactamente el
 * "onboarding / producción / revisión / publicar" pedido, reusada tal
 * cual, no un flujo nuevo.
 *
 * page_requests no junta usuario/contraseña (es solo un lead): se
 * generan acá, la contraseña nunca se expone ni se guarda en ningún
 * lado más que el hash — el superadmin la resetea desde "Cuenta" al
 * hacer el onboarding real, mismo mecanismo que ya existe para
 * cualquier cuenta.
 *
 * Idempotencia: claimPageRequestForConversion es la única guarda real
 * contra dos clics/llamadas concurrentes (ver ese archivo) — acá solo se
 * decide qué hacer según el resultado de crear el negocio, sin ninguna
 * comprobación adicional de "ya está convertida" (eso ya lo resolvió el
 * claim de forma atómica).
 */
export async function adminConvertPageRequestToBusiness(id: string): Promise<{
  success: boolean;
  error?: string;
  warning?: string;
  businessId?: string;
}> {
  await requireSuperAdmin();

  const claim = await claimPageRequestForConversion(id);
  if (!claim.success) return claim;

  const { request, previousStatus } = claim;

  const slug = await dedupeSlug(slugify(request.business_name));
  const username = slug;
  const password = crypto.randomBytes(24).toString("base64url");

  const formData = new FormData();
  formData.set("name", request.business_name);
  formData.set("slug", slug);
  formData.set("owner_name", request.owner_name);
  formData.set("username", username);
  formData.set("password", password);
  formData.set("whatsapp", request.whatsapp);
  formData.set("instagram", request.instagram);

  const result = await adminCreateBusiness(formData);

  if (!result.id) {
    // Ni el negocio se creó (username tomado, slug repetido, etc.) —
    // revertimos el claim para que la solicitud vuelva a ser
    // reintentable en vez de quedar "converted" sin negocio.
    await revertPageRequestClaim(id, previousStatus);
    return { success: false, error: result.error ?? "No se pudo crear el negocio." };
  }

  // Corrección post-creación: adminCreateBusiness no acepta pedir
  // published:false desde su FormData (y no lo tocamos para no romper
  // "Crear negocio" manual, que sí debe seguir publicando de entrada) —
  // ver comentario de la función. Se aplica pase lo que pase (incluso si
  // la cuenta del dueño falló): el negocio real ya existe y no debe
  // quedar publicado antes de la revisión.
  await updateBusiness(result.id, { published: false, onboarding_step: 0 });

  // El negocio existe (con o sin cuenta, ver adminCreateBusiness) —
  // completamos el vínculo pase lo que pase, para no dejar un negocio
  // real huérfano de su solicitud.
  await linkPageRequestToBusiness(id, result.id);
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin");

  if (!result.success) {
    return { success: true, businessId: result.id, warning: result.error };
  }
  return { success: true, businessId: result.id };
}
