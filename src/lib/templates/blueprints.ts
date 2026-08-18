import { SectionId, TemplateLayoutId } from "@/types/business";

// "Blueprint" = cómo compone cada plantilla las secciones exclusivas
// (Marquee/Statement/BeforeAfter/Social) alrededor de las 6 secciones
// reordenables de siempre (services/professionals/gallery/about/reviews/
// contact), sin tocar en absoluto section_order/sanitizeSectionOrder/
// SectionsManager — esas 6 siguen siendo 100% reordenables/activables
// por el negocio exactamente como hoy, dentro de cada bloque "core" que
// el blueprint le asigne.
//
// slot {type:"core"} sin `ids` = todas las secciones reordenables
// habilitadas, en el orden que tenga section_order. Con `ids`, solo esas
// (respetando su orden relativo dentro de section_order) — usado cuando
// una plantilla intercala una sección exclusiva EN MEDIO del bloque
// central (ej. Editorial pide Antes/Después entre Equipo y Testimonios).
export type BlueprintSlot =
  | { type: "core"; ids?: SectionId[] }
  | { type: "marquee" }
  | { type: "statement" }
  | { type: "beforeafter" }
  | { type: "social" };

export interface LayoutBlueprint {
  slots: BlueprintSlot[];
  // Fuente de encabezados/cuerpo — nombres de familia (para mostrar en
  // el picker) + variable CSS que expone next/font (ver src/app/layout.tsx).
  headingFont: { name: string; cssVar: string };
  bodyFont: { name: string; cssVar: string };
}

export const LAYOUT_BLUEPRINTS: Record<TemplateLayoutId, LayoutBlueprint> = {
  atelier: {
    slots: [{ type: "core" }],
    headingFont: { name: "Cormorant Garamond", cssVar: "--font-cormorant" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
  },
  noir: {
    slots: [{ type: "marquee" }, { type: "core" }],
    headingFont: { name: "Bebas Neue", cssVar: "--font-bebas" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
  },
  studio: {
    slots: [{ type: "core" }],
    headingFont: { name: "DM Sans", cssVar: "--font-dm-sans" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
  },
  editorial: {
    slots: [
      { type: "statement" },
      { type: "core", ids: ["services", "gallery", "professionals"] },
      { type: "beforeafter" },
      { type: "core", ids: ["reviews", "contact"] },
    ],
    headingFont: { name: "Playfair Display", cssVar: "--font-playfair" },
    bodyFont: { name: "Manrope", cssVar: "--font-manrope" },
  },
  bold: {
    slots: [
      { type: "core", ids: ["services"] },
      { type: "marquee" },
      { type: "core", ids: ["professionals", "gallery", "reviews"] },
      { type: "social" },
      { type: "core", ids: ["contact"] },
    ],
    headingFont: { name: "Space Grotesk", cssVar: "--font-space-grotesk" },
    bodyFont: { name: "DM Sans", cssVar: "--font-dm-sans" },
  },
};

export const TEMPLATE_LAYOUT_LABELS: Record<TemplateLayoutId, string> = {
  atelier: "Atelier",
  noir: "Noir",
  studio: "Studio",
  editorial: "Editorial",
  bold: "Bold",
};

export const TEMPLATE_LAYOUT_STYLE_TAGS: Record<TemplateLayoutId, string> = {
  atelier: "Editorial · Elegante · Espacio negativo",
  noir: "Oscuro · Cinematográfico · Urbano",
  studio: "Moderna · Versátil · Limpia",
  editorial: "Fashion · Asimétrica · Creativa",
  bold: "Urbana · Contemporánea · Fuerte",
};
