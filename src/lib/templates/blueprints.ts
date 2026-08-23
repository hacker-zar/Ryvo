import { Density, SectionId, TemplateLayoutId } from "@/types/business";

// "Blueprint" = cómo compone cada plantilla las secciones exclusivas
// (Marquee/Statement/BeforeAfter/Social) alrededor de las secciones
// reordenables de siempre (services/products/professionals/gallery/
// about/reviews/contact), sin tocar en absoluto section_order/
// sanitizeSectionOrder/SectionsManager — esas siguen siendo 100%
// reordenables/activables por el negocio exactamente como hoy, dentro de
// cada bloque "core" que el blueprint le asigne.
//
// slot {type:"core"} sin `ids` = todas las secciones reordenables
// habilitadas, en el orden que tenga section_order. Con `ids`, solo esas
// (respetando su orden relativo dentro de section_order) — usado cuando
// una plantilla intercala una sección exclusiva EN MEDIO del bloque
// central (ej. Editorial pide Antes/Después entre Equipo y Testimonios).
//
// ⚠️ Trampa a evitar: un slot "core" CON `ids` es una lista cerrada — un
// SectionId nuevo (como "products" al sumarse el catálogo) no aparece
// solo ahí, hay que agregarlo a mano a cada `ids` que corresponda (ver
// editorial/bold abajo). Los slots SIN `ids` (atelier/studio/el de noir)
// no tienen este problema: incluyen cualquier sección nueva automático.
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
  /**
   * Densidad propia de la plantilla. Vive acá y no en la base porque es
   * parte de su carácter, igual que su pareja tipográfica: elegir
   * "Atelier" ya debería traer el aire que la define, sin que el dueño
   * tenga que configurarlo aparte.
   *
   * Es además lo que resuelve un problema concreto del sistema de
   * plantillas: Atelier y Studio tienen el MISMO blueprint de slots
   * (`[{ type: "core" }]`), así que hasta ahora se diferenciaban solo
   * por la fuente — eran la misma página con otra tipografía. Con el
   * espacio negativo como eje, pasan a ser dos direcciones distintas.
   */
  density: Density;
}

export const LAYOUT_BLUEPRINTS: Record<TemplateLayoutId, LayoutBlueprint> = {
  atelier: {
    slots: [{ type: "core" }],
    headingFont: { name: "Cormorant Garamond", cssVar: "--font-cormorant" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
    // Lujo discreto: el aire ES la plantilla.
    density: "amplia",
  },
  noir: {
    slots: [{ type: "marquee" }, { type: "core" }],
    headingFont: { name: "Bebas Neue", cssVar: "--font-bebas" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
    // Urbana y densa: el contenido apretado es parte del tono.
    density: "compacta",
  },
  studio: {
    slots: [{ type: "core" }],
    headingFont: { name: "DM Sans", cssVar: "--font-dm-sans" },
    bodyFont: { name: "Inter", cssVar: "--font-inter" },
    density: "estandar",
  },
  editorial: {
    slots: [
      { type: "statement" },
      { type: "core", ids: ["services", "products", "academy", "gallery", "professionals"] },
      { type: "beforeafter" },
      { type: "core", ids: ["reviews", "contact"] },
    ],
    headingFont: { name: "Playfair Display", cssVar: "--font-playfair" },
    bodyFont: { name: "Manrope", cssVar: "--font-manrope" },
    density: "amplia",
  },
  bold: {
    slots: [
      { type: "core", ids: ["services", "products"] },
      { type: "marquee" },
      { type: "core", ids: ["professionals", "academy", "gallery", "reviews"] },
      { type: "social" },
      { type: "core", ids: ["contact"] },
    ],
    headingFont: { name: "Space Grotesk", cssVar: "--font-space-grotesk" },
    bodyFont: { name: "DM Sans", cssVar: "--font-dm-sans" },
    density: "compacta",
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
