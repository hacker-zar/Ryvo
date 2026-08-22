// Refleja src/components/AppearanceScope.tsx + src/lib/appearance-presets.ts:
// el fondo de un negocio es un color libre (input type="color"), no un
// preset — se replica acá (no se importa el .ts) por la misma razón que
// el resto de scripts/lib: este código corre con Node plano, sin loader
// de TypeScript. Si cambia AppearanceScope.tsx, replicar el cambio acá.
const { relativeLuminance, mixHex } = require("./color");

const DEFAULT_BACKGROUND = "#1a1815";
const DEFAULT_TEXT = "#f7f4ee";

/** Paleta resuelta lista para usar en las plantillas — misma resolución
 *  que AppearanceScope.tsx: background_color/text_color RAW del negocio
 *  ganan si están seteados, y solo caen al default si están vacíos;
 *  elevated/line se calculan mezclando el fondo hacia blanco o negro
 *  según sea oscuro o claro (mismo color-mix() de AppearanceScope, acá
 *  reimplementado en JS puro — ver mixHex). primary_color es el acento,
 *  siempre libre. */
function resolvePalette(business) {
  const background = business.background_color || DEFAULT_BACKGROUND;
  const text = business.text_color || DEFAULT_TEXT;
  const luminance = relativeLuminance(background);
  const isLight = luminance !== null && luminance > 0.179;
  const mixTarget = isLight ? "#000000" : "#ffffff";
  return {
    background,
    text,
    elevated: mixHex(background, mixTarget, 6),
    line: mixHex(background, mixTarget, 14),
    accent: business.primary_color || text,
  };
}

module.exports = { DEFAULT_BACKGROUND, DEFAULT_TEXT, resolvePalette };
