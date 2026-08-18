// Aproximación de los 3 presets de tipografía del sitio (clasica/moderna/
// elegante, ver src/app/globals.css) usando fuentes disponibles en el
// motor de rasterizado local (sharp/librsvg vía fontconfig), no las
// variables reales de Fraunces/Inter (que Next.js autohostea en build,
// no como archivos estables para reusar acá). Son las MISMAS familias de
// respaldo que ya declara globals.css para el momento antes de que carguen
// las variable fonts — no es una identidad inventada, es la misma
// degradación que ya contempla el proyecto.
const PRESETS = {
  clasica: {
    display: "Georgia, 'Times New Roman', Times, serif",
    sans: "Georgia, 'Times New Roman', Times, serif",
  },
  moderna: {
    display: "Arial, Helvetica, sans-serif",
    sans: "Arial, Helvetica, sans-serif",
  },
  elegante: {
    display: "Georgia, serif",
    sans: "Arial, Helvetica, sans-serif",
  },
};

function fontStackFor(preset) {
  return PRESETS[preset] || PRESETS.elegante;
}

module.exports = { fontStackFor };
