const { fitText, escapeXml } = require("./layout");
const { iconMarkup } = require("./icons");

// Geometría de cada viewBox — expuesta para que generate-materials.js
// pueda calcular el tamaño FÍSICO real del QR (mm) a partir de estas
// mismas unidades, en vez de hardcodear los números de nuevo para
// validate-qr.js (única fuente de verdad del layout).
const POSTER_VIEWBOX = { width: 700, height: 990 };
const CARD_VIEWBOX = { width: 890, height: 510 };

function textLines(lines, { x, startY, lineHeight, fontFamily, fontSize, fill, anchor = "middle", weight }) {
  return lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      const w = weight ? ` font-weight="${weight}"` : "";
      return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" text-anchor="${anchor}"${w}>${escapeXml(line)}</text>`;
    })
    .join("\n");
}

/**
 * Cartel vertical. El mismo template sirve para A4 y A5 porque ambos
 * comparten proporción ISO 216 (≈1:1.414) — la única diferencia entre
 * tamaños es la resolución de salida, no el layout. Coordenadas en un
 * viewBox fijo de 700×990 para que el diseño sea idéntico
 * independientemente del tamaño final de impresión.
 */
function buildPoster({ width, height, palette, ctaColor, fonts, business, logoAt, qr, ctaMain, ctaSub, footerLines }) {
  const VB_W = POSTER_VIEWBOX.width;
  const VB_H = POSTER_VIEWBOX.height;
  const cx = VB_W / 2;
  const logoNode = logoAt(cx, 180, 200);

  const name = fitText(business.name, {
    maxWidthPx: 600,
    maxLines: 2,
    maxFontSize: 44,
    minFontSize: 28,
    family: "serif",
  });
  const nameStartY = 300;
  const nameLineHeight = name.fontSize * 1.15;
  // Peor caso (nombre largo en 2 líneas al tamaño máximo) tiene que seguir
  // entrando en VB_H=990 junto con CTA + QR + footer — ver nota abajo.
  const nameBottom = nameStartY + (name.lines.length - 1) * nameLineHeight;

  const ctaY = nameBottom + 55;

  const qrCard = 420;
  const qrCardX = cx - qrCard / 2;
  const qrCardY = ctaY + 55;
  const qrPad = 40;
  const qrInner = qrCard - qrPad * 2;

  const footerY = qrCardY + qrCard + 55;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${VB_W} ${VB_H}">
  <rect width="${VB_W}" height="${VB_H}" fill="${palette.background}"/>
  <rect x="0" y="0" width="${VB_W}" height="10" fill="${palette.accent}"/>

  ${logoNode}

  ${textLines(name.lines, {
    x: cx,
    startY: nameStartY,
    lineHeight: nameLineHeight,
    fontFamily: fonts.display,
    fontSize: name.fontSize,
    fill: palette.text,
  })}

  <text x="${cx}" y="${ctaY}" font-family="${fonts.sans}" font-size="30" font-weight="600" fill="${ctaColor}" text-anchor="middle">${escapeXml(ctaMain)}</text>

  <rect x="${qrCardX}" y="${qrCardY}" width="${qrCard}" height="${qrCard}" rx="18" fill="${qr.bgColor}"/>
  <text x="${cx}" y="${qrCardY - 22}" font-family="${fonts.sans}" font-size="22" fill="${palette.text}" text-anchor="middle" opacity="0.85">${escapeXml(ctaSub)}</text>
  ${qr.embedAt(qrCardX + qrPad, qrCardY + qrPad, qrInner)}

  ${footerLines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${footerY + i * 34}" font-family="${fonts.sans}" font-size="24" fill="${palette.text}" text-anchor="middle" opacity="0.75">${escapeXml(line)}</text>`
    )
    .join("\n")}
</svg>`;

  return { svg, qrInnerUnits: qrInner, viewBox: POSTER_VIEWBOX };
}

/** Frente de tarjeta: solo identidad (logo + nombre + marca de acento),
 *  a propósito minimalista — el resto de la información va al dorso. */
function buildCardFront({ width, height, palette, fonts, business, logoAt }) {
  const VB_W = CARD_VIEWBOX.width;
  const VB_H = CARD_VIEWBOX.height;
  const cx = VB_W / 2;
  const logoNode = logoAt(cx, 170, 180);

  const name = fitText(business.name, {
    maxWidthPx: 720,
    maxLines: 2,
    maxFontSize: 40,
    minFontSize: 26,
    family: "serif",
  });
  const nameStartY = 330;
  const nameLineHeight = name.fontSize * 1.15;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${VB_W} ${VB_H}">
  <rect width="${VB_W}" height="${VB_H}" fill="${palette.background}"/>

  ${logoNode}

  ${textLines(name.lines, {
    x: cx,
    startY: nameStartY,
    lineHeight: nameLineHeight,
    fontFamily: fonts.display,
    fontSize: name.fontSize,
    fill: palette.text,
  })}

  <rect x="${cx - 45}" y="${nameStartY + (name.lines.length - 1) * nameLineHeight + 30}" width="90" height="6" rx="3" fill="${palette.accent}"/>
</svg>`;

  return { svg };
}

/** Dorso de tarjeta: todo lo accionable — QR + CTA + contacto — sin
 *  saturar (regla "no sobrecargarla con información"): como mucho
 *  Instagram y WhatsApp, solo si el negocio realmente los tiene
 *  cargados, nunca inventados. */
function buildCardBack({ width, height, palette, ctaColor, iconColor, fonts, business, qr, ctaMain, footerLine }) {
  const VB_W = CARD_VIEWBOX.width;
  const VB_H = CARD_VIEWBOX.height;

  const qrSize = 330;
  const qrPad = 20;
  const qrInner = qrSize - qrPad * 2;
  const qrX = 55;
  const qrY = (VB_H - qrSize) / 2 - 10;

  const colX = qrX + qrSize + 55;
  const colWidth = VB_W - colX - 40;

  const cta = fitText(ctaMain, {
    maxWidthPx: colWidth,
    maxLines: 2,
    maxFontSize: 34,
    minFontSize: 24,
    family: "sans",
  });
  const ctaStartY = 150;
  const ctaLineHeight = cta.fontSize * 1.15;

  let contactY = ctaStartY + (cta.lines.length - 1) * ctaLineHeight + 70;
  const contactRows = [];
  const iconSize = 34;

  if (business.instagram) {
    contactRows.push(
      `${iconMarkup("instagram", { x: colX, y: contactY - iconSize * 0.75, size: iconSize, fill: iconColor })}` +
        `<text x="${colX + iconSize + 14}" y="${contactY}" font-family="${fonts.sans}" font-size="26" fill="${palette.text}">@${escapeXml(business.instagram)}</text>`
    );
    contactY += 56;
  }
  if (business.whatsapp) {
    contactRows.push(
      `${iconMarkup("whatsapp", { x: colX, y: contactY - iconSize * 0.75, size: iconSize, fill: iconColor })}` +
        `<text x="${colX + iconSize + 14}" y="${contactY}" font-family="${fonts.sans}" font-size="26" fill="${palette.text}">WhatsApp</text>`
    );
    contactY += 56;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${VB_W} ${VB_H}">
  <rect width="${VB_W}" height="${VB_H}" fill="${palette.elevated}"/>

  <rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" rx="14" fill="${qr.bgColor}"/>
  ${qr.embedAt(qrX + qrPad, qrY + qrPad, qrInner)}

  ${textLines(cta.lines, {
    x: colX,
    startY: ctaStartY,
    lineHeight: ctaLineHeight,
    fontFamily: fonts.sans,
    fontSize: cta.fontSize,
    fill: ctaColor,
    anchor: "start",
    weight: 600,
  })}

  ${contactRows.join("\n")}

  <text x="${VB_W / 2}" y="${VB_H - 24}" font-family="${fonts.sans}" font-size="20" fill="${palette.text}" text-anchor="middle" opacity="0.7">${escapeXml(footerLine)}</text>
</svg>`;

  return { svg, qrInnerUnits: qrInner, viewBox: CARD_VIEWBOX };
}

module.exports = { buildPoster, buildCardFront, buildCardBack, POSTER_VIEWBOX, CARD_VIEWBOX };
