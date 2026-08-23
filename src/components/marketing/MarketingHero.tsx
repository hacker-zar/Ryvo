import Link from "next/link";

export default function MarketingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Resplandor sutil de fondo, sin imágenes ni iconografía de barbería */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--signal)" }}
      />

      <div className="relative mx-auto max-w-3xl px-4 pt-24 pb-20 md:pt-32 md:pb-28 text-center anim-fade">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">
          Software para peluquerías y barberías
        </p>

        <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-porcelain leading-[1.05]">
          Tu negocio, con presencia digital propia.
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-porcelain-muted text-base md:text-lg leading-relaxed">
          RYVO le da a tu peluquería o barbería una web propia con reservas
          online, todo administrado desde un panel simple. Sin depender de
          planillas ni de WhatsApp para agendar turnos.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/registro"
            className="rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity"
          >
            Quiero mi web
          </Link>
          <a
            href="#producto"
            className="rounded-full border border-graphite-line text-porcelain text-sm px-7 py-3.5 hover:border-porcelain-muted focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-colors"
          >
            Ver el producto
          </a>
        </div>
      </div>
    </section>
  );
}
