"use server";

import { verifyGoogleAccessToken } from "@/lib/google-identity";
import { getAdminSession } from "@/lib/admin/session";
import { completeAccountLogin } from "@/lib/admin/complete-account-login";
import {
  getAccountAuthByGoogleSub,
  setAccountGoogleIdentity,
  clearAccountGoogleIdentity,
} from "@/lib/data/accounts-repository";

// Mismo mensaje para "no vinculada" e "inactiva" que ACCOUNT_LOGIN_ERROR en
// auth-actions.ts — no revelar cuál de los dos casos es. Tampoco se
// distingue "cuenta inexistente" de "token de Google inválido": todo lo
// que no termina en un login exitoso cae acá.
const GOOGLE_LOGIN_ERROR = "Esta cuenta de Google no tiene acceso a RYVO.";

/**
 * Login de Owner/Worker con Google. Recibe SOLO un access_token opaco
 * (verificado server-side contra el propio servidor de Supabase Auth,
 * ver verifyGoogleAccessToken) — nunca un email/rol/business_id que el
 * cliente afirme. Sin ninguna rama de autoprovisión: si el Google
 * verificado no está vinculado a ninguna cuenta activa, rechaza. El rol
 * y el negocio siempre salen de la cuenta RYVO ya existente encontrada
 * por google_sub, nunca de Google.
 */
export async function loginAdminWithGoogle(
  accessToken: string
): Promise<{ success: false; error: string } | never> {
  const identity = await verifyGoogleAccessToken(accessToken);
  if (!identity) {
    return { success: false, error: GOOGLE_LOGIN_ERROR };
  }

  const account = await getAccountAuthByGoogleSub(identity.sub);
  if (!account || !account.active) {
    return { success: false, error: GOOGLE_LOGIN_ERROR };
  }

  return completeAccountLogin(account);
}

/**
 * Vincula la identidad de Google verificada a la cuenta de la sesión
 * ADMIN ACTUAL — el accountId nunca viene de un parámetro, siempre de
 * getAdminSession() leído fresco acá adentro. Exclusivo de sesión "owner"
 * (cubre Owner y Worker, que comparten role:"owner" a nivel de sesión,
 * diferenciados por accountRole) — Partner y Superadmin quedan fuera de
 * esta fase.
 */
export async function linkGoogleToOwnAccount(
  accessToken: string
): Promise<{ success: boolean; error?: string; email?: string }> {
  const session = await getAdminSession();
  if (!session || session.role !== "owner") {
    return { success: false, error: "No autorizado." };
  }

  const identity = await verifyGoogleAccessToken(accessToken);
  if (!identity) {
    return { success: false, error: "No se pudo verificar la cuenta de Google." };
  }

  const result = await setAccountGoogleIdentity(
    session.accountId,
    identity.sub,
    identity.email
  );
  if (!result.success) return result;
  return { success: true, email: identity.email };
}

export async function unlinkGoogleFromOwnAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getAdminSession();
  if (!session || session.role !== "owner") {
    return { success: false, error: "No autorizado." };
  }
  return clearAccountGoogleIdentity(session.accountId);
}
