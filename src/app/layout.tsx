import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reservas online para peluquerías y barberías",
  description: "Plantilla reutilizable de sitios web para peluquerías y barberías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
