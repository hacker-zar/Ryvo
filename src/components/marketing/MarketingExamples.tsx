import BrowserMockupFrame from "./BrowserMockupFrame";

const EXAMPLES = [
  { slug: "estudio-bravo", name: "Estudio Bravo", category: "Barbería" },
  { slug: "valentina-rey", name: "Valentina Rey Hairstylist", category: "Peluquería" },
];

export default function MarketingExamples() {
  return (
    <section id="ejemplos" className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-20 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-porcelain max-w-lg anim-fade">
          Así puede verse tu negocio online.
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {EXAMPLES.map((example) => (
            <div key={example.slug} className="anim-fade">
              <BrowserMockupFrame slug={example.slug} domainLabel={`ryvo.ar/${example.slug}`} />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-signal">
                    {example.category}
                  </p>
                  <p className="mt-1 text-porcelain font-medium">{example.name}</p>
                </div>
                <span className="text-sm text-porcelain-muted">Ver página →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
