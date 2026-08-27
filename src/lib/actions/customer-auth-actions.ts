"use server";

import { redirect } from "next/navigation";
import { verifyGoogleAccessToken } from "@/lib/google-identity";
import { getOrCreateCustomerByGoogle } from "@/lib/data/customers-repository";
import { createCustomerSession, destroyCustomerSession } from "@/lib/customer-session";

/**
 * Login de Customer con Google — a diferencia de Owner/Worker, SÍ
 * autoprovisiona: un Google verificado sin fila previa en `customers`
 * crea una identidad nueva ahí mismo (getOrCreateCustomerByGoogle). Sin
 * ningún botón público que la llame todavía (alcance de esta fase: solo
 * identidad + sesión) — queda lista para que un pedido futuro conecte la
 * UI y, más adelante, asocie bookings.customer_id.
 */
export async function loginCustomerWithGoogle(
  accessToken: string
): Promise<{ success: false; error: string } | never> {
  const identity = await verifyGoogleAccessToken(accessToken);
  if (!identity) {
    return { success: false, error: "No se pudo verificar la cuenta de Google." };
  }

  const result = await getOrCreateCustomerByGoogle(
    identity.sub,
    identity.email,
    identity.name
  );
  if (!result.success) {
    return { success: false, error: result.error };
  }

  await createCustomerSession(result.customer.id);
  redirect("/");
}

export async function logoutCustomer() {
  await destroyCustomerSession();
  redirect("/");
}
