import { headers } from "next/headers";

/**
 * URL pública absoluta ACTUAL de un negocio — protocolo + host reales del
 * request entrante, nunca un dominio hardcodeado ni una env var fija. Si
 * cambia el dominio (deploy nuevo, dominio propio) o el slug del negocio,
 * el resultado cambia solo, sin tocar código. Mismo criterio que ya usa el
 * link "Powered by RYVO" del Footer (`href="/"`, resuelve solo al origin
 * actual) — esto es lo mismo, pero como URL absoluta (hace falta una
 * absoluta para poder meterla en un QR, a diferencia de un link interno).
 *
 * `x-forwarded-proto` es el header que ya manda Vercel (y la mayoría de
 * los proxies) con el protocolo real; en dev no viene, así que cae al
 * heurístico de host (localhost → http, cualquier otro host → https).
 */
export async function getPublicSiteUrl(slug: string): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = forwardedProto ?? (isLocalHost ? "http" : "https");
  return `${protocol}://${host}/${slug}`;
}
