import Image from "next/image";
import Link from "next/link";

/**
 * Header de la landing de RYVO como plataforma ("/"). Deliberadamente
 * distinto de src/components/Header.tsx (que es el header de cada
 * negocio, data-driven por business.primary_color/logo/slug): acá no hay
 * un "business", RYVO es la marca.
 *
 * El isotipo tiene dos variantes generadas de un mismo original (ver
 * scripts en el historial de esta sesión): ryvo-logo.png (negro, fondos
 * claros) y ryvo-logo-light.png (porcelana, fondos oscuros) — el header
 * es oscuro (bg-graphite), así que usa la variante clara.
 */
export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-graphite/80 backdrop-blur border-b border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <Image
          src="/ryvo-logo-light.png"
          alt="RYVO"
          width={307}
          height={204}
          className="h-7 w-auto"
          priority
        />

        <Link
          href="/admin/login"
          className="text-xs uppercase tracking-[0.15em] text-porcelain-muted hover:text-porcelain transition-colors"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}
