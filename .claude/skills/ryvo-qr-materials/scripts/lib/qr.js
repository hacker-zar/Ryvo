// Genera el QR reusando el MISMO componente que ya usa el sitio público
// (qrcode.react, ver src/components/Contact.tsx) renderizado a SVG
// estático server-side — así el QR de los materiales impresos usa
// exactamente la misma librería/lógica de encoding que el QR que ya
// funciona en producción, en vez de reimplementar el algoritmo QR.
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const { QRCodeSVG } = require("qrcode.react");

// Nivel de corrección de errores alto (~30% de tolerancia) a propósito:
// estos QR van a materiales impresos que se manosean, se pegan con cinta,
// se desgastan con el sol — no una pantalla. `marginSize: 4` es el
// quiet zone mínimo que exige la spec QR (ver comentario de qrcode.react);
// bajarlo arriesga que lectores de cámara no lo detecten.
const QR_LEVEL = "H";
const QR_MARGIN_MODULES = 4;

/**
 * Devuelve el QR como SVG standalone (string completo) y también ya
 * descompuesto en viewBox + contenido interno, listo para reincrustar
 * como `<svg>` anidado dentro de una plantilla más grande sin duplicar el
 * <?xml?>/namespace.
 */
function renderQr({ value, size = 600, fgColor = "#000000", bgColor = "#ffffff" }) {
  if (!value || typeof value !== "string") {
    throw new Error("renderQr: 'value' (URL a codificar) es obligatorio.");
  }
  const el = React.createElement(QRCodeSVG, {
    value,
    size,
    level: QR_LEVEL,
    marginSize: QR_MARGIN_MODULES,
    fgColor,
    bgColor,
  });
  const svg = ReactDOMServer.renderToStaticMarkup(el);

  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const modulesPerSide = viewBoxMatch
    ? Number(viewBoxMatch[1].split(" ")[2])
    : null;

  return {
    value,
    fullSvg: svg,
    viewBox: viewBoxMatch ? viewBoxMatch[1] : `0 0 ${size} ${size}`,
    inner,
    modulesPerSide,
    level: QR_LEVEL,
    marginModules: QR_MARGIN_MODULES,
    fgColor,
    bgColor,
  };
}

/** `<svg>` anidado listo para insertar dentro de otra plantilla, ya
 *  posicionado en (x, y) con lado `size`. */
function embedQr(qr, { x, y, size }) {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${qr.viewBox}">${qr.inner}</svg>`;
}

module.exports = { renderQr, embedQr, QR_LEVEL, QR_MARGIN_MODULES };
