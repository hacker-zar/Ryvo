import Image from "next/image";
import Link from "next/link";

// 404 global de RYVO como plataforma — para rutas o slugs que
// directamente no existen (no hay negocio del cual tomar identidad acá;
// para un negocio real que todavía no publicó su web, ver
// src/app/[slug]/coming-soon.tsx, que sí usa su propia marca).
export default function NotFound() {
  return (
    <div className="min-h-screen bg-graphite flex flex-col items-center justify-center px-4 text-center">
      <Image
        src="/ryvo-logo-light.png"
        alt="RYVO"
        width={307}
        height={204}
        className="h-8 w-auto mb-8"
      />
      <p className="text-xs uppercase tracking-[0.25em] text-signal">404</p>
      <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-porcelain">
        Esta página no existe.
      </h1>
      <p className="mt-4 max-w-sm text-porcelain-muted text-sm md:text-base leading-relaxed">
        Puede que el link esté mal escrito o que la página ya no esté
        disponible.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity"
      >
        Volver a RYVO
      </Link>
    </div>
  );
}
