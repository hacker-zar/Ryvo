import { cookies } from "next/headers";
import crypto from "crypto";
import { promisify } from "util";
import { AccountRole } from "@/types/business";

const scryptAsync = promisify(crypto.scrypt);

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

// Cookie separada y liviana (no autenticación, solo una preferencia de
// navegación) que recuerda desde qué negocio se entró al panel, para
// poder volver ahí al cerrar sesión. No se firma: si se manipula, en el
// peor caso el logout redirige a un slug incorrecto o inexistente, sin
// ningún impacto de seguridad.
const ORIGIN_COOKIE_NAME = "admin_origin";
const ORIGIN_COOKIE_TTL_SECONDS = 60 * 60 * 24; // 1 día

/**
 * Dos formas de tener sesión de admin:
 * - "super": RYVO (contraseña compartida ADMIN_PASSWORD) — puede gestionar
 *   cualquier negocio, y es la única que puede crear negocios nuevos.
 *   Independiente del sistema de cuentas: no tiene fila en `accounts`.
 * - "owner": una cuenta real (tabla `accounts`, usuario + contraseña)
 *   vinculada a UN negocio puntual. `businessId` viene de la cuenta
 *   autenticada en el momento del login (`accounts.business_id`), nunca de
 *   un parámetro que mande el cliente — por eso alcanza con leerlo de acá
 *   para autorizar, sin volver a consultar la base en cada request.
 *
 * `accountRole` (distinto de `role` acá arriba, que es el nivel de
 * autenticación) es el rol de la cuenta DENTRO del negocio
 * (dueño/administrador/trabajador — ver `AccountRole` en types/business.ts).
 * Hoy toda cuenta nace "owner" (no hay UI para crear otro rol todavía), así
 * que esto no cambia ningún comportamiento observable — es la estructura
 * lista para cuando se construya un filtrado real por rol (ver
 * src/lib/admin/roles.ts).
 */
export type AdminSession =
  | { role: "super" }
  | {
      role: "owner";
      accountId: string;
      businessId: string;
      accountRole: AccountRole;
    };

function getSecret(): string {
  // En dev, si no se configuró, usamos un valor fijo: solo importa que
  // la firma sea consistente entre requests del mismo proceso.
  return process.env.ADMIN_PASSWORD_SECRET ?? "dev-secret-not-for-production";
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

/** Verifica el password contra la variable de entorno ADMIN_PASSWORD (superadmin RYVO). */
export function checkSuperAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hash de contraseña (scrypt + salt aleatoria, sin dependencias nuevas —
 * usa el módulo `crypto` nativo de Node). Formato guardado: "salt:hash",
 * ambos en hex. Genérico: lo usan las cuentas (accounts.password_hash);
 * no depende de qué se está autenticando.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hashHex, "hex");
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function encodeSession(session: AdminSession, issuedAt: string): string {
  const businessId = session.role === "owner" ? session.businessId : "";
  const accountId = session.role === "owner" ? session.accountId : "";
  const accountRole = session.role === "owner" ? session.accountRole : "";
  const payload = `${session.role}.${businessId}.${accountId}.${accountRole}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

async function setSessionCookie(session: AdminSession) {
  const issuedAt = Date.now().toString();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(session, issuedAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function createSuperAdminSession() {
  await setSessionCookie({ role: "super" });
}

export async function createOwnerSession(
  accountId: string,
  businessId: string,
  accountRole: AccountRole = "owner"
) {
  await setSessionCookie({ role: "owner", accountId, businessId, accountRole });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Lee y valida la sesión de admin actual. null si no hay o no es válida. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 6) return null;
  const [role, businessId, accountId, accountRole, issuedAt, signature] = parts;

  const payload = `${role}.${businessId}.${accountId}.${accountRole}.${issuedAt}`;
  if (!signaturesMatch(sign(payload), signature)) return null;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!(age >= 0 && age <= SESSION_TTL_SECONDS)) return null;

  if (role === "super") return { role: "super" };
  if (role === "owner" && businessId && accountId) {
    return {
      role: "owner",
      accountId,
      businessId,
      accountRole: (accountRole || "owner") as AccountRole,
    };
  }
  return null;
}

/** true si la sesión (super, o dueño de ESE negocio puntual) puede gestionar `businessId`. */
export function canManageBusiness(
  session: AdminSession | null,
  businessId: string
): boolean {
  if (!session) return false;
  if (session.role === "super") return true;
  return session.businessId === businessId;
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
