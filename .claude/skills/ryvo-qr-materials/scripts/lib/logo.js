const fs = require("fs");
const path = require("path");

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function mimeFor(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  return MIME_BY_EXT[ext] || "image/png";
}

let sharpModule;
function tryLoadSharp(repoRoot) {
  if (sharpModule !== undefined) return sharpModule;
  try {
    sharpModule = require(path.join(repoRoot, "node_modules", "sharp"));
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

/**
 * Trae el logo real del negocio (nunca inventa uno): acepta una ruta
 * local bajo /public (assets de demo/desarrollo) o una URL absoluta
 * (Supabase Storage en producción, ver next.config.ts). Devuelve null si
 * el negocio no tiene logo cargado — el llamador debe usar el respaldo
 * de monograma y avisar que falta, nunca inventar un logo.
 */
async function loadLogo(logoValue, repoRoot) {
  if (!logoValue) return null;

  let buffer;
  if (/^https?:\/\//i.test(logoValue)) {
    const res = await fetch(logoValue);
    if (!res.ok) {
      throw new Error(`No se pudo descargar el logo (${res.status}): ${logoValue}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    const localPath = path.join(repoRoot, "public", logoValue.replace(/^\/+/, ""));
    if (!fs.existsSync(localPath)) {
      throw new Error(`Logo no encontrado en el filesystem local: ${localPath}`);
    }
    buffer = fs.readFileSync(localPath);
  }

  const mime = mimeFor(logoValue);
  let width = null;
  let height = null;
  const sharp = tryLoadSharp(repoRoot);
  if (sharp && mime !== "image/svg+xml") {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      // Si sharp no puede leer los metadatos igual seguimos: el llamador
      // cae al bounding box cuadrado por defecto.
    }
  }

  return {
    dataUri: `data:${mime};base64,${buffer.toString("base64")}`,
    mime,
    width,
    height,
  };
}

/** `<image>` centrado en un cuadrado (cx,cy,size), preservando aspect
 *  ratio si se conoce el tamaño real; si no, asume que es cuadrado. */
function logoImageMarkup(logo, { cx, cy, size }) {
  let w = size;
  let h = size;
  if (logo.width && logo.height) {
    const ratio = logo.width / logo.height;
    if (ratio > 1) {
      w = size;
      h = size / ratio;
    } else {
      h = size;
      w = size * ratio;
    }
  }
  const x = cx - w / 2;
  const y = cy - h / 2;
  return `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${logo.dataUri}" preserveAspectRatio="xMidYMid meet"/>`;
}

/** Respaldo neutro cuando el negocio no tiene logo cargado: un círculo
 *  con la inicial del nombre, en la paleta real del negocio (nunca una
 *  identidad inventada) — ver regla "si no hay logo, usar monograma
 *  neutro y avisar qué falta" de la skill. */
function monogramMarkup(businessName, { cx, cy, size, bg, fg, stroke, fontFamily }) {
  const letter = (businessName || "?").trim().charAt(0).toUpperCase() || "?";
  const r = size / 2 - 1;
  const fontSize = size * 0.42;
  // `stroke` opcional: cuando el fondo del negocio y el relleno del
  // círculo son tonos muy parecidos (paleta "oscura" curada), sin borde
  // el círculo casi no se distingue — ver iteración visual del cartel.
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="2"` : "";
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"${strokeAttr}/>
    <text x="${cx}" y="${cy}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fg}" text-anchor="middle" dominant-baseline="central">${letter}</text>
  </g>`;
}

module.exports = { loadLogo, logoImageMarkup, monogramMarkup };
