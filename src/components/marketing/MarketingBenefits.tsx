const BENEFITS = [
  {
    title: "Profesional",
    description:
      "Tu negocio deja de depender únicamente de Instagram o WhatsApp para mostrar quién sos.",
  },
  {
    title: "Siempre disponible",
    description: "Tus clientes pueden consultar tu información cuando quieran.",
  },
  {
    title: "Fácil de compartir",
    description: "Un solo enlace para poner en Instagram, WhatsApp, Google y donde quieras.",
  },
  {
    title: "Hecha para vos",
    description: "No tenés que aprender a diseñar ni construir una página.",
  },
];

export default function MarketingBenefits() {
  return (
    <section className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-20 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-porcelain max-w-lg anim-fade">
          Una página que trabaja por tu negocio.
        </h2>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title}>
              <h3 className="text-lg font-semibold text-porcelain">{benefit.title}</h3>
              <p className="mt-2 text-sm text-porcelain-muted leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
