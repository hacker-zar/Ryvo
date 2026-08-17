import { getBusinessIdBySlug } from "@/lib/data/business-repository";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Le agrega un sufijo numerico ("-2", "-3", ...) al slug si ya esta en
 * uso, hasta encontrar uno libre. Necesario para el registro
 * self-service: un superadmin cargando negocios uno por uno rara vez
 * choca nombres, pero cualquier visitante puede elegir un nombre de
 * negocio ya usado por otro.
 */
export async function dedupeSlug(base: string): Promise<string> {
  const root = base || "negocio";
  let candidate = root;
  let suffix = 2;
  while (await getBusinessIdBySlug(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
