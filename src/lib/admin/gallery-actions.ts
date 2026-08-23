"use server";

import { revalidatePath } from "next/cache";
import { requireAdminFor } from "@/lib/admin/authorize";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";

// requireAdminFor: gestionar la galería es exclusivo del editor completo
// — Barber no tiene ningún acceso de escritura sobre recursos del
// negocio (ver plan RBAC).
export async function adminUpdateGallery(
  businessId: string,
  gallery: string[]
): Promise<{ success: boolean; error?: string }> {
  await requireAdminFor(businessId);

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder editar la galería.",
    };
  }

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ gallery })
    .eq("id", businessId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/negocios/${businessId}`);
  return { success: true };
}
