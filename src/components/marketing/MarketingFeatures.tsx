const FEATURES = [
  {
    number: "01",
    title: "Página propia",
    description:
      "Un sitio con la identidad de tu negocio: colores, tipografía, logo y fotos, sin tocar código.",
  },
  {
    number: "02",
    title: "Reservas online",
    description:
      "Tus clientes eligen servicio, día y horario, y confirman el turno solos, desde el celular.",
  },
  {
    number: "03",
    title: "Panel de gestión",
    description:
      "Cargá servicios, horarios, locales y fotos, y mirá los turnos reservados, todo en un solo lugar.",
  },
];

export default function MarketingFeatures() {
  return (
    <section className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-20 md:py-24">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {FEATURES.map((feature) => (
            <div key={feature.number}>
              <span className="text-xs font-mono text-signal">
                {feature.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-porcelain">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-porcelain-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
