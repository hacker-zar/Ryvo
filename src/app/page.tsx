import Link from "next/link";
import { demoBusiness } from "@/lib/data/demo-business";

// Landing simple de la plataforma. En producción cada negocio se sirve
// desde su propia URL/dominio apuntando a /[slug]; esta página solo
// facilita navegar al demo durante el desarrollo.
export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 bg-ink">
      <div className="text-center max-w-md">
        <p className="section-eyebrow text-brass">Plantilla multi-negocio</p>
        <h1 className="section-title mt-3 text-2xl text-bone">
          Peluquerías y barberías
        </h1>
        <p className="mt-3 text-sm text-bone-muted">
          Cada negocio tiene su propia página, configurada por datos y no por código.
        </p>
        <Link
          href={`/${demoBusiness.slug}`}
          className="section-eyebrow mt-6 inline-block rounded-sm bg-brass text-ink text-xs font-semibold px-6 py-3.5 hover:opacity-90 transition-opacity"
        >
          Ver demo: {demoBusiness.name}
        </Link>
      </div>
    </main>
  );
}
