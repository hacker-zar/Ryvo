// RYVO define la estructura y el sistema visual de la web de cada negocio;
// el dueño personaliza dentro de límites curados, no con libertad total —
// ver "Apariencia" en el editor. El fondo NO es un color libre: son dos
// variantes prediseñadas (oscuro/claro), cada una con su propio par
// fondo+texto+superficie-elevada+línea ya afinado para que contraste bien
// solo. Guardamos los valores resueltos en las mismas columnas
// background_color/text_color de siempre (sin cambio de esquema) — este
// archivo es la única fuente de verdad de qué hex corresponde a cada
// variante, para que el form (appearance-form.tsx) y el render
// (AppearanceScope.tsx) nunca queden desincronizados.
export const BACKGROUND_VARIANTS = {
  oscuro: {
    label: "Oscuro",
    background: "#1a1815",
    text: "#f7f4ee",
    elevated: "#242019",
    line: "#3a342c",
  },
  claro: {
    label: "Claro",
    background: "#f7f4ee",
    text: "#1a1815",
    elevated: "#efe8db",
    line: "#ddd0ba",
  },
} as const;

export type BackgroundVariant = keyof typeof BACKGROUND_VARIANTS;

export const DEFAULT_BACKGROUND_VARIANT: BackgroundVariant = "oscuro";

/** A qué variante corresponde un background_color guardado. Cualquier
 *  valor que no coincida con ninguna variante conocida (dato legado antes
 *  de este cambio) cae en "oscuro" — el default de siempre. */
export function backgroundVariantFor(backgroundColor?: string): BackgroundVariant {
  if (backgroundColor === BACKGROUND_VARIANTS.claro.background) return "claro";
  return DEFAULT_BACKGROUND_VARIANT;
}
