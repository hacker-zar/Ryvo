"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Cliente de Supabase separado del `supabase` de lib/supabase.ts (ese es
 * de lectura pública, flujo "implicit" por default) — este solo existe
 * para el handshake OAuth de Google desde el navegador, con PKCE.
 *
 * `persistSession: true` no es opcional: `signInWithOAuth` hace una
 * navegación completa hacia Google, que destruye cualquier estado en
 * memoria de JS. Sin persistir en localStorage real, el `code_verifier`
 * de PKCE no sobrevive el viaje de ida y vuelta y `exchangeCodeForSession`
 * fallaría siempre. La sesión de Supabase Auth igual no queda viva más de
 * un instante: /auth/callback llama `signOut()` apenas obtiene el
 * access_token — un solo sistema de sesión real en todo momento (las
 * cookies firmadas propias de RYVO).
 */
export function getGoogleOAuthClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}
