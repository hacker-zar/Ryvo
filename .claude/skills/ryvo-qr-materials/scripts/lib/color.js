// Fórmulas de contraste WCAG 2.x — mismo cálculo que
// src/lib/format.ts (readableTextColor/contrastRatio). Se reimplementan
// acá (en vez de importar el archivo TS) porque estos scripts corren con
// Node plano fuera del build de Next.js. Si cambia la fórmula en
// src/lib/format.ts, replicar el cambio acá.

function normalizeHex(hex) {
  const cleaned = String(hex || "").trim().replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  return /^[0-9a-fA-F]{6}$/.test(full) ? full : null;
}

function relativeLuminance(hex) {
  const full = normalizeHex(hex);
  if (!full) return null;
  const [r, g, b] = [0, 2, 4].map(
    (i) => parseInt(full.slice(i, i + 2), 16) / 255
  );
  const linear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableTextColor(backgroundHex, options) {
  const dark = options?.dark ?? "#1a1815";
  const light = options?.light ?? "#f7f4ee";
  const luminance = relativeLuminance(backgroundHex);
  if (luminance === null) return dark;
  return luminance > 0.179 ? dark : light;
}

// El QR nunca debe arriesgar legibilidad por estética: preferimos negro
// puro sobre blanco puro salvo que el negocio tenga un primary_color lo
// bastante oscuro como para reemplazar al negro sin perder contraste
// (regla del proyecto: "no sacrificar legibilidad del QR por diseño").
// Umbral 7:1 (WCAG AAA) en vez de 4.5:1 porque un QR tolera bastante
// menos ambigüedad que texto: apunta al contraste más alto disponible.
const QR_MIN_CONTRAST = 7;

function pickQrColors(primaryHex) {
  const full = normalizeHex(primaryHex);
  if (!full) {
    return { fg: "#000000", bg: "#ffffff", usedPrimary: false };
  }
  const ratio = contrastRatio(`#${full}`, "#ffffff");
  if (ratio !== null && ratio >= QR_MIN_CONTRAST) {
    return { fg: `#${full}`, bg: "#ffffff", usedPrimary: true };
  }
  return { fg: "#000000", bg: "#ffffff", usedPrimary: false };
}

// El acento (primary_color) lo elige el dueño pensando en cómo se ve
// sobre el fondo/superficies de SU sitio (ver readableTextColor en
// src/lib/format.ts) — no hay ninguna garantía de que también contraste
// bien contra cualquier superficie que este script decida usar (ej. la
// superficie "elevada" del monograma, que puede ser bien oscura). Antes
// de pintar texto/una letra en color de acento, hay que confirmar que
// contrasta contra ESA superficie puntual, y si no, caer a un color que
// sí se lea — nunca dejar texto invisible por usar la marca "tal cual".
const MIN_TEXT_CONTRAST = 4.5;

function pickReadableAccent(accentHex, bgHex, fallbackHex, minRatio = MIN_TEXT_CONTRAST) {
  const ratio = contrastRatio(accentHex, bgHex);
  if (ratio !== null && ratio >= minRatio) return accentHex;
  return fallbackHex;
}

module.exports = {
  normalizeHex,
  relativeLuminance,
  contrastRatio,
  readableTextColor,
  pickQrColors,
  pickReadableAccent,
  QR_MIN_CONTRAST,
  MIN_TEXT_CONTRAST,
};
