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
              {/* `.ticket-number` y no `font-mono`: esa clase no tenía
                  ninguna familia definida en el sistema, así que caía en
                  la monoespaciada por defecto del sistema operativo
                  (Consolas/Menlo/Courier según el equipo) — justo en la
                  primera pantalla que ve alguien evaluando el producto.
                  El numerito de ticket ya es el recurso de RYVO para
                  numerar en los sitios de negocio; usarlo también acá lo
                  refuerza en vez de tener dos tratamientos del mismo
                  gesto. */}
              <span className="ticket-number text-xs text-signal">
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
