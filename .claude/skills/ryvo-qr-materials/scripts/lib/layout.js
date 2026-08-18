// Sin motor real de layout de texto (no hay DOM/canvas disponible en este
// script), así que el ancho de cada línea se estima con un factor
// promedio de ancho de carácter por tamaño de fuente. Es una
// aproximación deliberada — sirve para decidir cuántas líneas necesita un
// nombre de negocio largo y bajar el tamaño si no entra, no para un
// layout pixel-perfect. `serif` es algo más angosto en promedio que
// `sans` a igual tamaño.
const AVG_CHAR_WIDTH_FACTOR = { serif: 0.52, sans: 0.56 };

function estimateWidth(text, fontSize, family = "sans") {
  return text.length * fontSize * AVG_CHAR_WIDTH_FACTOR[family];
}

function wrapAtWidth(text, fontSize, maxWidthPx, family) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateWidth(candidate, fontSize, family) <= maxWidthPx || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Encuentra el tamaño de fuente más grande (entre minFontSize y
 * maxFontSize) con el que `text` entra en `maxLines` líneas de a lo sumo
 * `maxWidthPx` cada una. Baja el tamaño de a pasos hasta que entra, o se
 * queda en minFontSize truncando si ni así entra (mejor una fuente chica
 * completa que una grande cortada).
 */
function fitText(text, { maxWidthPx, maxLines = 2, maxFontSize, minFontSize = 24, family = "sans" }) {
  for (let size = maxFontSize; size >= minFontSize; size -= 2) {
    const lines = wrapAtWidth(text, size, maxWidthPx, family);
    if (lines.length <= maxLines) {
      return { fontSize: size, lines };
    }
  }
  const lines = wrapAtWidth(text, minFontSize, maxWidthPx, family).slice(0, maxLines);
  return { fontSize: minFontSize, lines };
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = { estimateWidth, wrapAtWidth, fitText, escapeXml };
