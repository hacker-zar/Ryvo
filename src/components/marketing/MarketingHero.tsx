import Link from "next/link";
import BrowserMockupFrame from "./BrowserMockupFrame";

export default function MarketingHero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--signal)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 md:pt-28">
        <div className="max-w-2xl mx-auto text-center anim-fade">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-porcelain leading-[1.05]">
            Tu negocio merece una página a la altura.
          </h1>

          <p className="mt-6 text-porcelain-muted text-base md:text-lg leading-relaxed">
            RYVO diseña y publica páginas web profesionales para negocios
            de Rosario. Vos nos contás sobre tu negocio. Nosotros hacemos
            el resto.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/solicitar"
              className="rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity"
            >
              Quiero mi página →
            </Link>
            <a
              href="#ejemplos"
              className="rounded-full border border-graphite-line text-porcelain text-sm px-7 py-3.5 hover:border-porcelain-muted focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-colors"
            >
              Ver ejemplos
            </a>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-signal">
            Disponible actualmente en Rosario
          </p>
        </div>

        {/* Composición: 2 sitios reales, levemente superpuestos y
            rotados — "esto es lo que RYVO puede hacer por tu negocio",
            no una ilustración genérica. */}
        <div className="relative mt-16 md:mt-20 mx-auto max-w-3xl anim-slide-up">
          <div className="hidden sm:block absolute left-0 top-6 w-[42%] -rotate-3 z-0">
            <BrowserMockupFrame slug="valentina-rey" domainLabel="ryvo.ar/valentina-rey" />
          </div>
          <div className="relative z-10 mx-auto w-[78%] sm:w-[58%] rotate-1">
            <BrowserMockupFrame slug="estudio-bravo" domainLabel="ryvo.ar/estudio-bravo" />
          </div>
        </div>
      </div>
    </section>
  );
}
