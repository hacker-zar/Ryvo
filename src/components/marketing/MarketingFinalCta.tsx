import Link from "next/link";

export default function MarketingFinalCta() {
  return (
    <section id="solicitar" className="border-t border-graphite-line">
      <div className="mx-auto max-w-2xl px-4 py-20 md:py-28 text-center anim-fade">
        <h2 className="text-3xl md:text-5xl font-semibold text-porcelain">
          ¿Querés una página para tu negocio?
        </h2>
        <p className="mt-4 text-porcelain-muted leading-relaxed">
          Contanos un poco sobre tu negocio y nos ponemos en contacto con
          vos.
        </p>
        <Link
          href="/solicitar"
          className="mt-9 inline-block rounded-full bg-porcelain text-graphite text-base font-semibold px-9 py-4 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity"
        >
          Solicitar mi página →
        </Link>
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-signal">
          Disponible actualmente en Rosario.
        </p>
      </div>
    </section>
  );
}
