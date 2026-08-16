import Link from "next/link";

/**
 * Header de la landing de RYVO como plataforma ("/"). Deliberadamente
 * distinto de src/components/Header.tsx (que es el header de cada
 * negocio, data-driven por business.primary_color/logo/slug): acá no hay
 * un "business", RYVO es la marca.
 */
export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-graphite/80 backdrop-blur border-b border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-porcelain">
          RY<span className="text-signal">V</span>O
        </span>

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
