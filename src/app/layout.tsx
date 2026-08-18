import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  Cormorant_Garamond,
  Bebas_Neue,
  DM_Sans,
  Playfair_Display,
  Manrope,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

// Únicas 2 familias del sitio base (autohospedadas por Next, sin
// requests externos en runtime). Ambas son variable fonts con rango
// amplio de pesos, así que alcanzan para cubrir los 3 presets de
// tipografía (elegante/clásica/moderna) sin sumar más archivos de
// fuente — ver el mapeo en globals.css.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Fuentes de las 5 plantillas oficiales (sistema de plantillas) — cada
// una es la fuente de encabezado (o cuerpo, ver LAYOUT_BLUEPRINTS en
// src/lib/templates/blueprints.ts) fija de una plantilla puntual, no
// parte del sistema de 3 presets de arriba. Bebas Neue no es variable
// (un solo peso 400 en Google Fonts), por eso necesita `weight` explícito
// — el resto sí lo son.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const TEMPLATE_FONT_VARIABLES = [
  cormorantGaramond.variable,
  bebasNeue.variable,
  dmSans.variable,
  playfairDisplay.variable,
  manrope.variable,
  spaceGrotesk.variable,
].join(" ");

export const metadata: Metadata = {
  title: "RYVO",
  description:
    "RYVO — software de presencia digital y reservas online para peluquerías y barberías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${fraunces.variable} ${inter.variable} ${TEMPLATE_FONT_VARIABLES}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
