#!/usr/bin/env node
// Última puerta antes de entregar un material como "final" (regla de la
// skill: "si el QR no puede verificarse correctamente, no entregar el
// diseño como final"). No decodifica el QR con una cámara real — este
// entorno no tiene una — pero sí confirma todo lo que se puede confirmar
// sin eso: que el valor codificado es la URL real y no una inventada, que
// el contraste/margen/nivel de corrección cumplen el mínimo para que un
// lector de cámara lo levante, y que el QR impreso no queda microscópico.
// La skill (SKILL.md) le suma a esto una inspección visual del PNG y,
// como paso final, pedirle al usuario un escaneo real antes de imprimir
// en cantidad.

const fs = require("fs");
const path = require("path");
const { contrastRatio, QR_MIN_CONTRAST } = require("./lib/color");

const MIN_QR_MM = { poster: 25, card: 20 };

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

function check(id, description, pass, detail) {
  return { id, description, pass, detail };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifest) throw new Error("Falta --manifest <manifest.json> (salida de generate-materials.js).");

  const manifest = JSON.parse(fs.readFileSync(args.manifest, "utf8"));
  const checks = [];

  let parsedValue = null;
  try {
    parsedValue = new URL(manifest.qr.value);
  } catch {
    parsedValue = null;
  }
  checks.push(
    check(
      "url-well-formed",
      "El valor codificado en el QR es una URL http(s) válida",
      parsedValue !== null && (parsedValue.protocol === "https:" || parsedValue.protocol === "http:"),
      manifest.qr.value
    )
  );

  checks.push(
    check(
      "url-matches-booking",
      "El QR codifica exactamente la bookingUrl resuelta del negocio (no una URL distinta o inventada)",
      manifest.qr.value === manifest.bookingUrl,
      `qr.value=${manifest.qr.value} vs bookingUrl=${manifest.bookingUrl}`
    )
  );

  checks.push(
    check(
      "url-matches-public-site",
      "La bookingUrl es la publicUrl real del negocio + el parámetro de reserva (no un dominio/slug distinto)",
      manifest.bookingUrl.startsWith(manifest.publicUrl),
      `publicUrl=${manifest.publicUrl}`
    )
  );

  checks.push(
    check(
      "error-correction-high",
      "Nivel de corrección de errores 'H' (tolera desgaste/pliegues de un material impreso)",
      manifest.qr.level === "H",
      `level=${manifest.qr.level}`
    )
  );

  checks.push(
    check(
      "margin-quiet-zone",
      "Quiet zone de al menos 4 módulos (mínimo de la spec QR para que un lector lo reconozca)",
      manifest.qr.marginModules >= 4,
      `marginModules=${manifest.qr.marginModules}`
    )
  );

  const recomputedContrast = contrastRatio(manifest.qr.fgColor, manifest.qr.bgColor);
  checks.push(
    check(
      "qr-contrast",
      `Contraste del QR (${manifest.qr.fgColor} sobre ${manifest.qr.bgColor}) de al menos ${QR_MIN_CONTRAST}:1`,
      recomputedContrast !== null && recomputedContrast >= QR_MIN_CONTRAST,
      `contrastRatio=${recomputedContrast}`
    )
  );

  for (const [key, file] of Object.entries(manifest.files || {})) {
    if (file.qrPhysicalSizeMm === undefined) continue;
    const category = key.startsWith("poster") ? "poster" : "card";
    const min = MIN_QR_MM[category];
    checks.push(
      check(
        `qr-size-${key}`,
        `QR en ${key} de al menos ${min}mm de lado a tamaño real (mínimo recomendado para escaneo con cámara de celular)`,
        file.qrPhysicalSizeMm >= min,
        `${file.qrPhysicalSizeMm.toFixed(1)}mm a ${file.dpi}dpi`
      )
    );
  }

  const ok = checks.every((c) => c.pass);
  const result = {
    ok,
    manifest: path.resolve(args.manifest),
    checks,
    failedChecks: checks.filter((c) => !c.pass).map((c) => c.id),
    reminder:
      "Esto no reemplaza un escaneo real con un celular: antes de imprimir en cantidad, escanear al menos el PNG final (o una impresión de prueba) con la cámara del teléfono.",
  };

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = ok ? 0 : 1;
}

main();
