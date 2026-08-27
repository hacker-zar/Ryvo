const STEPS = [
  {
    number: "01",
    title: "Nos contás sobre tu negocio",
    description: "Nombre, servicios, fotos, ubicación, redes y lo que quieras comunicar.",
  },
  {
    number: "02",
    title: "RYVO diseña tu página",
    description:
      "Creamos una página adaptada a tu negocio, con diseño profesional y optimizada para celular.",
  },
  {
    number: "03",
    title: "La publicamos",
    description: "Te entregamos una página lista para compartir con tus clientes.",
  },
];

export default function MarketingHowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-20 md:py-24">
        <div className="max-w-xl anim-fade">
          <h2 className="text-3xl md:text-4xl font-semibold text-porcelain">
            Nosotros hacemos la página. Vos te ocupás de tu negocio.
          </h2>
          <p className="mt-4 text-porcelain-muted leading-relaxed">
            No necesitás aprender diseño, programación ni herramientas
            complicadas. Nos contás cómo es tu negocio, qué servicios
            ofrecés y qué querés mostrar. RYVO diseña una página pensada
            para que tus clientes puedan conocerte y contactarte.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="ticket-number text-xs text-signal">{step.number}</span>
              <h3 className="mt-3 text-lg font-semibold text-porcelain">{step.title}</h3>
              <p className="mt-2 text-sm text-porcelain-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
