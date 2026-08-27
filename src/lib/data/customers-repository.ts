import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { Customer } from "@/types/business";

/**
 * Login/autoprovisión con Google — un solo upsert atómico por
 * google_sub (mismo criterio que bookings_no_overlap: la base es la
 * defensa final contra la carrera de doble-click, no el chequeo previo).
 * Un customer existente actualiza email/name a lo último reportado por
 * Google y devuelve la MISMA fila (mismo id) — nunca duplica.
 */
export async function getOrCreateCustomerByGoogle(
  googleSub: string,
  email: string,
  name: string
): Promise<{ success: true; customer: Customer } | { success: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("customers")
    .upsert({ google_sub: googleSub, email, name }, { onConflict: "google_sub" })
    .select("id, google_sub, email, name, created_at")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, customer: data };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("customers")
    .select("id, google_sub, email, name, created_at")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
