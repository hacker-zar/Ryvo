import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Únicas 2 familias reales del sitio (autohospedadas por Next, sin
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

export const metadata: Metadata = {
  title: "RYVO",
  description:
    "RYVO — software de presencia digital y reservas online para peluquerías y barberías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${fraunces.variable} ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
