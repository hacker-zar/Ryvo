"use server";

import { supabase } from "@/lib/supabase";

export interface CreatePageRequestInput {
  owner_name: string;
  business_name: string;
  whatsapp: string;
  instagram?: string;
  business_type?: string;
  what_you_want?: string;
  comments?: string;
}

/**
 * "Quiero mi página" en la home pública — un lead, no un alta real (a
 * diferencia de registerBusiness en register-business.ts, que crea
 * cuenta+negocio+login al instante). Sin `.select()` encadenado al
 * insert a propósito: page_requests no tiene ninguna política de
 * lectura (mismo motivo que academy_interests, ver academy-actions.ts)
 * — encadenar `.select()` exige una política de SELECT que rompería el
 * insert entero.
 */
export async function submitPageRequest(
  input: CreatePageRequestInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.owner_name.trim() || !input.business_name.trim() || !input.whatsapp.trim()) {
    return { success: false, error: "Completá todos los campos obligatorios." };
  }
  if (!supabase) {
    return { success: false, error: "No se pudo enviar la solicitud." };
  }

  const { error } = await supabase.from("page_requests").insert({
    owner_name: input.owner_name.trim(),
    business_name: input.business_name.trim(),
    whatsapp: input.whatsapp.trim(),
    instagram: input.instagram?.trim() || "",
    business_type: input.business_type?.trim() || "",
    what_you_want: input.what_you_want?.trim() || "",
    comments: input.comments?.trim() || "",
    status: "new",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
