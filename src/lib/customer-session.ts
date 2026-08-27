import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "customer_session";
// Más larga que la sesión admin (8h): un cliente final no debería tener
// que volver a loguearse cada vez que entra a reservar.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

/**
 * HMAC propio, duplicado a propósito en vez de compartido con
 * src/lib/admin/session.ts: Customer y Admin son sujetos independientes
 * (TTL distinto, payload distinto, evolución futura potencialmente
 * distinta) y session.ts es el archivo de sesión de todo el RBAC
 * existente — no se toca solo para extraer 10 líneas de HMAC. Secreto
 * propio (CUSTOMER_SESSION_SECRET) para que rotar uno no invalide el
 * otro.
 */
function getSecret(): string {
  return process.env.CUSTOMER_SESSION_SECRET ?? "dev-secret-not-for-production-customer";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function createCustomerSession(customerId: string) {
  const issuedAt = Date.now().toString();
  const payload = `${customerId}.${issuedAt}`;
  const value = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function getCustomerSession(): Promise<{ customerId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [customerId, issuedAt, signature] = parts;

  const payload = `${customerId}.${issuedAt}`;
  if (!signaturesMatch(sign(payload), signature)) return null;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!(age >= 0 && age <= SESSION_TTL_SECONDS)) return null;

  if (!customerId) return null;
  return { customerId };
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
