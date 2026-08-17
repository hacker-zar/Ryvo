import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { Account } from "@/types/business";

// Todas las columnas de `accounts` MENOS password_hash — mismo criterio que
// BUSINESS_PUBLIC_COLUMNS en business-repository.ts: cualquier lectura cuyo
// resultado pueda terminar como prop de un Client Component usa esta lista,
// nunca select("*"). `accounts` además no tiene ninguna política RLS
// pública (a diferencia de businesses): solo supabaseAdmin puede leerla, así
// que la única protección real del hash es que estas funciones nunca lo
// seleccionan.
const ACCOUNT_PUBLIC_COLUMNS = "id, business_id, name, username, active, created_at";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// ---------------------------------------------------------------------
// Autenticación — única función autorizada a leer password_hash.
// ---------------------------------------------------------------------

export async function getAccountAuthByUsername(username: string): Promise<{
  id: string;
  business_id: string;
  password_hash: string;
  active: boolean;
} | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, business_id, password_hash, active")
    .eq("username", normalizeUsername(username))
    .single();
  return data ?? null;
}

// ---------------------------------------------------------------------
// Gestión de cuentas — usadas por /admin (crear negocio, sección "Cuenta").
// ---------------------------------------------------------------------

export async function listAccountsByBusiness(
  businessId: string
): Promise<Account[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("accounts")
    .select(ACCOUNT_PUBLIC_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  return Boolean(data);
}

export interface CreateAccountInput {
  business_id: string;
  name: string;
  username: string;
  password_hash: string;
  active?: boolean;
}

export async function createAccount(
  input: CreateAccountInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .insert({
      business_id: input.business_id,
      name: input.name,
      username: normalizeUsername(input.username),
      password_hash: input.password_hash,
      active: input.active ?? true,
    })
    .select("id")
    .single();
  if (error) {
    // Índice único de username — mismo patrón defensivo que
    // bookings_no_duplicate_slot: el chequeo previo (isUsernameTaken) puede
    // perder una carrera, la base es la defensa final.
    if (error.code === "23505") {
      return { success: false, error: "Ese usuario ya está en uso." };
    }
    return { success: false, error: error.message };
  }
  return { success: true, id: data.id };
}

export async function updateAccount(
  id: string,
  input: Partial<{ name: string; username: string; active: boolean }>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const payload = { ...input };
  if (payload.username) payload.username = normalizeUsername(payload.username);

  const { error } = await supabaseAdmin
    .from("accounts")
    .update(payload)
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ese usuario ya está en uso." };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateAccountPassword(
  id: string,
  passwordHash: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ password_hash: passwordHash })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
