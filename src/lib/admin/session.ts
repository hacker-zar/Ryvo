import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

// Cookie separada y liviana (no autenticación, solo una preferencia de
// navegación) que recuerda desde qué negocio se entró al panel, para
// poder volver ahí al cerrar sesión. No se firma: si se manipula, en el
// peor caso el logout redirige a un slug incorrecto o inexistente, sin
// ningún impacto de seguridad.
const ORIGIN_COOKIE_NAME = "admin_origin";
const ORIGIN_COOKIE_TTL_SECONDS = 60 * 60 * 24; // 1 día

function getSecret(): string {
  // En dev, si no se configuró, usamos un valor fijo: solo importa que
  // la firma sea consistente entre requests del mismo proceso.
  return process.env.ADMIN_PASSWORD_SECRET ?? "dev-secret-not-for-production";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

/** Verifica el password contra la variable de entorno ADMIN_PASSWORD. */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Comparación en tiempo constante para evitar timing attacks triviales.
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${issuedAt}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [issuedAt, signature] = raw.split(".");
  if (!issuedAt || !signature) return false;

  if (sign(issuedAt) !== signature) return false;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  return age >= 0 && age <= SESSION_TTL_SECONDS;
}

/** Recuerda desde qué slug de negocio se entró al panel de administración,
 *  para poder volver ahí al cerrar sesión (ver logoutAdmin). */
export async function setAdminOrigin(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORIGIN_COOKIE_NAME, slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ORIGIN_COOKIE_TTL_SECONDS,
    path: "/",
  });
}

export async function getAdminOrigin(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORIGIN_COOKIE_NAME)?.value ?? null;
}

export async function clearAdminOrigin() {
  const cookieStore = await cookies();
  cookieStore.delete(ORIGIN_COOKIE_NAME);
}
