import { SectionConfig, SectionId } from "@/types/business";

// Mismo orden que el default de la migración — es también el orden
// histórico hardcodeado que tenía BusinessSite.tsx antes de esta
// funcionalidad, así que un negocio sin section_order configurado (o con
// datos corruptos/incompletos) se ve exactamente igual que siempre.
export const DEFAULT_SECTION_ORDER: SectionConfig[] = [
  { id: "services", enabled: true },
  { id: "professionals", enabled: true },
  { id: "gallery", enabled: true },
  { id: "about", enabled: true },
  { id: "reviews", enabled: true },
  { id: "contact", enabled: true },
];

const KNOWN_SECTION_IDS: SectionId[] = DEFAULT_SECTION_ORDER.map((s) => s.id);

/**
 * Valida/repara un section_order crudo (de la base, o de un formulario):
 * descarta ids desconocidos, reinserta al final (activos) cualquier id
 * conocido que falte. Se usa tanto al leer (defensa en profundidad, por
 * si la fila es de antes de la migración o quedó con datos parciales)
 * como al validar lo que llega desde el editor antes de guardar.
 */
export function sanitizeSectionOrder(
  raw: SectionConfig[] | null | undefined
): SectionConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SECTION_ORDER;

  const seen = new Set<SectionId>();
  const cleaned: SectionConfig[] = [];

  for (const entry of raw) {
    if (
      entry &&
      typeof entry === "object" &&
      KNOWN_SECTION_IDS.includes(entry.id) &&
      !seen.has(entry.id)
    ) {
      seen.add(entry.id);
      cleaned.push({ id: entry.id, enabled: Boolean(entry.enabled) });
    }
  }

  for (const id of KNOWN_SECTION_IDS) {
    if (!seen.has(id)) cleaned.push({ id, enabled: true });
  }

  return cleaned;
}
