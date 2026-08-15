import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público: respeta las políticas de RLS (lectura pública, y
// creación de bookings/reviews desde el sitio). Se usa en todo lo que
// corre en el navegador o en lecturas del servidor.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Cliente de administración: usa la service role key, que se salta RLS.
// SOLO se usa dentro de server actions ya protegidas por sesión de admin
// (ver src/lib/admin/actions.ts), nunca se expone al navegador — por eso
// la variable no lleva el prefijo NEXT_PUBLIC_.
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export const isSupabaseConfigured = Boolean(supabase);
export const isSupabaseAdminConfigured = Boolean(supabaseAdmin);
