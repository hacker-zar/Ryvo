// Mismas 2 variantes curadas que src/lib/appearance-presets.ts (oscuro/
// claro) — background_color/text_color de un negocio siempre son una de
// estas dos combinaciones ya afinadas, nunca colores libres. Se replica
// acá (no se importa el .ts) por la misma razón que el resto de scripts/lib:
// este código corre con Node plano, sin loader de TypeScript. Si cambia
// appearance-presets.ts, replicar el cambio acá.
const BACKGROUND_VARIANTS = {
  oscuro: {
    background: "#1a1815",
    text: "#f7f4ee",
    elevated: "#242019",
    line: "#3a342c",
  },
  claro: {
    background: "#f7f4ee",
    text: "#1a1815",
    elevated: "#efe8db",
    line: "#ddd0ba",
  },
};

function variantFor(backgroundColor) {
  if (backgroundColor === BACKGROUND_VARIANTS.claro.background) return "claro";
  return "oscuro";
}

/** Paleta resuelta lista para usar en las plantillas — misma resolución
 *  que src/components/AppearanceScope.tsx: background_color/text_color
 *  RAW del negocio ganan si están seteados (algunos negocios cargados
 *  antes de que background/text pasaran a ser 2 variantes curadas tienen
 *  un hex propio, ej. "#1e1206"), y solo caen al preset si están vacíos;
 *  elevated/line SIEMPRE salen del preset más cercano (el negocio nunca
 *  los elige directo). primary_color es el acento, siempre libre. */
function resolvePalette(business) {
  const variant = variantFor(business.background_color);
  const base = BACKGROUND_VARIANTS[variant];
  return {
    variant,
    background: business.background_color || base.background,
    text: business.text_color || base.text,
    elevated: base.elevated,
    line: base.line,
    accent: business.primary_color || base.text,
  };
}

module.exports = { BACKGROUND_VARIANTS, variantFor, resolvePalette };
