"use server";

import { revalidatePath } from "next/cache";
import { requireAdminFor } from "@/lib/admin/authorize";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";

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
