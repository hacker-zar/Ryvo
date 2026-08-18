#!/usr/bin/env node
// Genera el cartel (A4/A5) y la tarjeta (frente/dorso) de un negocio a
// partir del JSON que devuelve resolve-business.js — nunca inventa datos:
// todo lo que se dibuja viene de ese JSON o son cálculos derivados
// (paleta curada, contraste, wrap de texto).
//
// Uso:
//   node resolve-business.js --slug bella-vista > business.json
//   node generate-materials.js --input business.json --out ./materials/bella-vista

const fs = require("fs");
const path = require("path");

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
      if (pkg.name === "ryvo") return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("No se encontró la raíz del repo RYVO subiendo desde " + startDir);
}

const REPO_ROOT = findRepoRoot(__dirname);

const { resolvePalette } = require("./lib/appearance");
const { fontStackFor } = require("./lib/fonts");
const { pickQrColors, pickReadableAccent, contrastRatio } = require("./lib/color");
const { loadLogo, logoImageMarkup, monogramMarkup } = require("./lib/logo");
const { renderQr, embedQr } = require("./lib/qr");
const { buildPoster, buildCardFront, buildCardBack } = require("./lib/svg-templates");

const DPI = 300;
function mmToPx(mm) {
  return Math.round((mm / 25.4) * DPI);
}

const SIZES_MM = {
  a4: { w: 210, h: 297 },
  a5: { w: 148, h: 210 },
  card: { w: 89, h: 51 },
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

let sharp;
try {
  sharp = require(path.join(REPO_ROOT, "node_modules", "sharp"));
} catch {
  sharp = null;
}

async function rasterize(svgString, outPngPath) {
  if (!sharp) return { rasterized: false };
  await sharp(Buffer.from(svgString)).png().toFile(outPngPath);
  return { rasterized: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) throw new Error("Falta --input <business.json> (salida de resolve-business.js).");
  if (!args.out) throw new Error("Falta --out <directorio de salida>.");

  const input = JSON.parse(fs.readFileSync(args.input, "utf8"));
  if (!input.found) {
    throw new Error(
      "El JSON de entrada no tiene un negocio válido (found:false) — no se puede generar nada sin identidad real."
    );
  }
  const business = input.business;
  const outDir = args.out;
  fs.mkdirSync(outDir, { recursive: true });

  const palette = resolvePalette(business);
  const fonts = fontStackFor(business.typography_preset);
  const qrColorChoice = pickQrColors(business.primary_color);

  // El primary_color del negocio no viene garantizado a contrastar contra
  // TODA superficie que usa esta skill (el dueño lo eligió pensando en su
  // propio sitio) — antes de usarlo como color de texto, confirmar
  // contraste contra la superficie puntual donde va a pintarse, y si no
  // alcanza, caer a palette.text (que sí está curado para leerse bien
  // sobre background/elevated). Ver lib/color.js pickReadableAccent.
  const accentOnBackground = pickReadableAccent(palette.accent, palette.background, palette.text);
  const accentOnElevated = pickReadableAccent(palette.accent, palette.elevated, palette.text);

  let logoReal = null;
  let logoError = null;
  try {
    logoReal = await loadLogo(business.logo, REPO_ROOT);
  } catch (err) {
    logoError = err.message;
  }

  function logoAt(cx, cy, size) {
    if (logoReal) return logoImageMarkup(logoReal, { cx, cy, size });
    return monogramMarkup(business.name, {
      cx,
      cy,
      size,
      bg: palette.elevated,
      fg: accentOnElevated,
      stroke: palette.line,
      fontFamily: fonts.display,
    });
  }

  const qrRendered = renderQr({
    value: input.bookingUrl,
    size: 600,
    fgColor: qrColorChoice.fg,
    bgColor: qrColorChoice.bg,
  });
  const qrForTemplate = {
    bgColor: qrColorChoice.bg,
    embedAt: (x, y, size) => embedQr(qrRendered, { x, y, size }),
  };

  const ctaMain = "Reservá tu turno";
  const ctaSub = "Escaneá para reservar";
  const displayUrl = input.publicUrl.replace(/^https?:\/\//, "");
  // Una sola línea en el cartel (URL) — el @instagram ya vive en el
  // dorso de la tarjeta; repetirlo acá solo suma texto sin agregar
  // información nueva ("no sobrecargar", y hay poco margen vertical).
  const footerLines = [displayUrl];

  const manifest = {
    business: { id: business.id, name: business.name, slug: business.slug },
    generatedAt: new Date().toISOString(),
    publicUrl: input.publicUrl,
    bookingUrl: input.bookingUrl,
    siteUrlSource: input.siteUrlSource,
    missing: input.missing || [],
    warnings: [...(input.warnings || [])],
    palette,
    typography: { preset: business.typography_preset || null, resolved: fonts },
    qr: {
      value: qrRendered.value,
      level: qrRendered.level,
      marginModules: qrRendered.marginModules,
      fgColor: qrRendered.fgColor,
      bgColor: qrRendered.bgColor,
      usedPrimaryColorAsForeground: qrColorChoice.usedPrimary,
      contrastRatioFgBg: contrastRatio(qrRendered.fgColor, qrRendered.bgColor),
    },
    logo: logoReal
      ? { source: business.logo, width: logoReal.width, height: logoReal.height }
      : { source: null, fallback: "monogram" },
    files: {},
  };

  if (logoError) {
    manifest.warnings.push(`No se pudo cargar el logo (${business.logo}): ${logoError}. Se usó un monograma neutro como respaldo.`);
  }
  if (!logoReal) {
    manifest.warnings.push(
      "El negocio no tiene logo cargado en RYVO: se usó un monograma con la inicial del nombre. Recomendar al dueño subir un logo real para un resultado más profesional."
    );
  }
  if (!qrColorChoice.usedPrimary) {
    manifest.warnings.push(
      `El primary_color del negocio (${business.primary_color}) no tiene suficiente contraste para el QR (mínimo ${require("./lib/color").QR_MIN_CONTRAST}:1 contra blanco): se usó negro puro para no arriesgar la lectura del código.`
    );
  }
  if (accentOnBackground !== palette.accent || accentOnElevated !== palette.accent) {
    manifest.warnings.push(
      `El primary_color del negocio (${business.primary_color}) no contrasta lo suficiente como texto sobre alguna superficie del diseño: se reemplazó por el color de texto curado (${palette.text}) en esos lugares para que se siga leyendo bien.`
    );
  }
  manifest.colorSubstitutions = { accentOnBackground, accentOnElevated, rawAccent: palette.accent };

  const posterSizes = args.poster ? String(args.poster).split(",") : ["a4", "a5"];
  for (const key of posterSizes) {
    const mm = SIZES_MM[key];
    if (!mm) continue;
    const width = mmToPx(mm.w);
    const height = mmToPx(mm.h);
    const poster = buildPoster({ width, height, palette, ctaColor: accentOnBackground, fonts, business, logoAt, qr: qrForTemplate, ctaMain, ctaSub, footerLines });
    const svgPath = path.join(outDir, `poster-${key}.svg`);
    fs.writeFileSync(svgPath, poster.svg);
    const pngPath = path.join(outDir, `poster-${key}.png`);
    const raster = await rasterize(poster.svg, pngPath);
    manifest.files[`poster-${key}`] = {
      svg: path.relative(outDir, svgPath),
      png: raster.rasterized ? path.relative(outDir, pngPath) : null,
      widthMm: mm.w,
      heightMm: mm.h,
      widthPx: width,
      heightPx: height,
      dpi: DPI,
      qrPhysicalSizeMm: (poster.qrInnerUnits / poster.viewBox.width) * mm.w,
    };
  }

  if (args.card !== "no") {
    const mm = SIZES_MM.card;
    const width = mmToPx(mm.w);
    const height = mmToPx(mm.h);

    const front = buildCardFront({ width, height, palette, fonts, business, logoAt });
    const frontSvgPath = path.join(outDir, "card-front.svg");
    fs.writeFileSync(frontSvgPath, front.svg);
    const frontPngPath = path.join(outDir, "card-front.png");
    const frontRaster = await rasterize(front.svg, frontPngPath);

    const footerLine = displayUrl;
    const back = buildCardBack({ width, height, palette, ctaColor: accentOnElevated, iconColor: accentOnElevated, fonts, business, qr: qrForTemplate, ctaMain, footerLine });
    const backSvgPath = path.join(outDir, "card-back.svg");
    fs.writeFileSync(backSvgPath, back.svg);
    const backPngPath = path.join(outDir, "card-back.png");
    const backRaster = await rasterize(back.svg, backPngPath);

    manifest.files["card-front"] = {
      svg: path.relative(outDir, frontSvgPath),
      png: frontRaster.rasterized ? path.relative(outDir, frontPngPath) : null,
      widthMm: mm.w,
      heightMm: mm.h,
      widthPx: width,
      heightPx: height,
      dpi: DPI,
    };
    manifest.files["card-back"] = {
      svg: path.relative(outDir, backSvgPath),
      png: backRaster.rasterized ? path.relative(outDir, backPngPath) : null,
      widthMm: mm.w,
      heightMm: mm.h,
      widthPx: width,
      heightPx: height,
      dpi: DPI,
      qrPhysicalSizeMm: (back.qrInnerUnits / back.viewBox.width) * mm.w,
    };
  }

  if (!sharp) {
    manifest.warnings.push(
      "sharp no está disponible en node_modules: se generaron los .svg pero no los .png de impresión. Instalar/reinstalar dependencias para poder rasterizar, o abrir los .svg en un editor y exportar manualmente."
    );
  }

  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ok: true, outDir, manifest: manifestPath }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message, stack: err.stack }, null, 2));
  process.exitCode = 1;
});
