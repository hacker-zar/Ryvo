import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { Account, AccountRole } from "@/types/business";

// Todas las columnas de `accounts` MENOS password_hash — mismo criterio que
// BUSINESS_PUBLIC_COLUMNS en business-repository.ts: cualquier lectura cuyo
// resultado pueda terminar como prop de un Client Component usa esta lista,
// nunca select("*"). `accounts` además no tiene ninguna política RLS
// pública (a diferencia de businesses): solo supabaseAdmin puede leerla, así
// que la única protección real del hash es que estas funciones nunca lo
// seleccionan.
const ACCOUNT_PUBLIC_COLUMNS =
  "id, business_id, name, username, role, professional_id, active, created_at";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// ---------------------------------------------------------------------
// Autenticación — única función autorizada a leer password_hash.
// ---------------------------------------------------------------------

export async function getAccountAuthByUsername(username: string): Promise<{
  id: string;
  business_id: string | null;
  password_hash: string;
  role: AccountRole;
  professional_id: string | null;
  active: boolean;
} | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, business_id, password_hash, role, professional_id, active")
    .eq("username", normalizeUsername(username))
    .single();
  return data ?? null;
}

/**
 * Login con Google: busca la cuenta ya vinculada a este `google_sub`
 * (ver setAccountGoogleIdentity). `role <> 'partner'` es defensa en
 * profundidad — hoy ninguna UI de vinculación escribe google_sub en una
 * fila partner, pero Partner queda fuera de esta fase por diseño y esta
 * query lo blinda igual. Sin autoprovisión: si no hay fila, devuelve
 * null y el caller rechaza el login (ver google-auth-actions.ts).
 */
export async function getAccountAuthByGoogleSub(googleSub: string): Promise<{
  id: string;
  business_id: string | null;
  role: AccountRole;
  professional_id: string | null;
  active: boolean;
} | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id, business_id, role, professional_id, active")
    .eq("google_sub", googleSub)
    .neq("role", "partner")
    .maybeSingle();
  return data ?? null;
}

/**
 * Solo el estado de vínculo de Google de UNA cuenta puntual — nunca se
 * mezcla con ACCOUNT_PUBLIC_COLUMNS/listAccountsByBusiness, para que un
 * dueño no vea de paso el email de Google de las cuentas Barber que
 * administra (no se pidió, sería exponer más de lo necesario).
 */
export async function getAccountGoogleLink(
  accountId: string
): Promise<{ googleEmail: string | null } | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("google_email")
    .eq("id", accountId)
    .maybeSingle();
  if (!data) return null;
  return { googleEmail: data.google_email ?? null };
}

/**
 * Vincula una identidad de Google a una cuenta ya autenticada —
 * `accountId` debe salir siempre de la sesión actual (ver
 * linkGoogleToOwnAccount en google-auth-actions.ts), nunca de un
 * parámetro de request. El índice único accounts_google_sub_idx es la
 * defensa final contra que el mismo Google termine en dos cuentas.
 */
export async function setAccountGoogleIdentity(
  accountId: string,
  googleSub: string,
  googleEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ google_sub: googleSub, google_email: googleEmail })
    .eq("id", accountId);
  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Esa cuenta de Google ya está vinculada a otra cuenta de RYVO.",
      };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function clearAccountGoogleIdentity(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ google_sub: null, google_email: null })
    .eq("id", accountId);
  if (error) return { success: false, error: error.message };
  return { success: true };
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
  // null únicamente para role === "partner" — ver Account.business_id en
  // types/business.ts.
  business_id: string | null;
  name: string;
  username: string;
  password_hash: string;
  role?: AccountRole;
  // Requerido cuando role === "worker" — a qué profesional queda atada
  // la cuenta (ver Editor rápido). Ignorado/null para el resto.
  professional_id?: string | null;
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
  const role = input.role ?? "owner";
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .insert({
      business_id: role === "partner" ? null : input.business_id,
      name: input.name,
      username: normalizeUsername(input.username),
      password_hash: input.password_hash,
      role,
      professional_id: role === "worker" ? input.professional_id ?? null : null,
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

/**
 * Elimina una cuenta permanentemente (a diferencia de `active: false`,
 * que solo la pausa — ver updateAccount arriba). Si era una cuenta
 * `partner`, `businesses.partner_id` de sus negocios asignados y las
 * filas de `partner_businesses` quedan limpias solas (`on delete set
 * null`/`on delete cascade`, ver supabase/schema.sql) — no hace falta
 * desasignar nada a mano antes de borrar.
 */
export async function deleteAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      success: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const { error } = await supabaseAdmin.from("accounts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Todas las cuentas de RYVO (todos los negocios + partners) — exclusivo
 *  del panel global del superadmin (`/admin/usuarios`). Dataset chico hoy
 *  (un puñado de negocios/cuentas): un solo `select *` sin paginar, igual
 *  criterio que `listBusinesses`. */
export async function listAllAccounts(): Promise<Account[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("accounts")
    .select(ACCOUNT_PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Solo las cuentas `role: "partner"` — usado para el selector "asignar a
 *  Partner" al crear/editar un negocio. */
export async function listPartnerAccounts(): Promise<Account[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("accounts")
    .select(ACCOUNT_PUBLIC_COLUMNS)
    .eq("role", "partner")
    .order("created_at", { ascending: false });
  return data ?? [];
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
