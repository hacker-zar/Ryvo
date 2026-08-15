"use server";

import { revalidatePath } from "next/cache";
import { hasValidAdminSession } from "@/lib/admin/session";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";

async function requireAdmin() {
  const ok = await hasValidAdminSession();
  if (!ok) throw new Error("No autorizado.");
}

export async function adminUpdateGallery(
  businessId: string,
  gallery: string[]
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

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
