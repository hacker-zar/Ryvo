"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessMember } from "@/lib/admin/authorize";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";

// La galería es un recurso COMPARTIDO del negocio (un solo array, sin
// noción de "de qué profesional es esta foto" — confirmado antes de
// construir el Editor rápido), así que cualquier cuenta que pueda
// gestionar el negocio, dueño o profesional, tiene el mismo poder sobre
// ella. requireBusinessMember en vez de requireAdminFor, sin chequeo
// adicional en la rama "worker".
export async function adminUpdateGallery(
  businessId: string,
  gallery: string[]
): Promise<{ success: boolean; error?: string }> {
  await requireBusinessMember(businessId);

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
