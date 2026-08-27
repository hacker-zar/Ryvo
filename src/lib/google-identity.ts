import { supabase } from "@/lib/supabase";

export interface VerifiedGoogleIdentity {
  // auth.users.id de Supabase Auth para esta identidad de Google ya
  // verificada — no el claim "sub" crudo del JWT de Google. Estable por
  // cuenta de Google dentro de este proyecto de Supabase (ver
  // accounts.google_sub / customers.google_sub).
  sub: string;
  email: string;
  name: string;
}

/**
 * Única función de todo el feature de Google login que le cree algo a un
 * token: reenvía el `accessToken` a Supabase Auth (`getUser`), que lo
 * valida contra su propio servidor sin depender de nada guardado en el
 * navegador. Todo lo que termina en `accounts`/`customers` sale de acá,
 * nunca de lo que el cliente reporte sobre sí mismo.
 */
export async function verifyGoogleAccessToken(
  accessToken: string
): Promise<VerifiedGoogleIdentity | null> {
  if (!supabase || !accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  const user = data.user;
  if (user.app_metadata?.provider !== "google") return null;
  if (!user.email) return null;

  return {
    sub: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || "",
  };
}
