export default function MarketingRosario() {
  return (
    <section className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-20 md:py-24 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        <div className="anim-fade">
          <h2 className="text-3xl md:text-4xl font-semibold text-porcelain">
            Empezamos por Rosario.
          </h2>
          <p className="mt-4 text-porcelain-muted leading-relaxed max-w-md">
            RYVO está trabajando actualmente con negocios de Rosario y
            alrededores. Conocemos el mercado local y podemos acompañarte
            personalmente durante el proceso.
          </p>
        </div>

        {/* Referencia visual sutil, no turística — un pin sobre una
            grilla simplificada, mismo lenguaje gráfico (stroke fino,
            currentColor) que el resto de los iconos del sistema. */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          fill="none"
          aria-hidden
          className="justify-self-center md:justify-self-end opacity-90"
        >
          <circle cx="70" cy="70" r="69" stroke="var(--graphite-line)" />
          <circle cx="70" cy="70" r="46" stroke="var(--graphite-line)" />
          <path
            d="M70 40C58.95 40 50 48.95 50 60C50 75 70 96 70 96C70 96 90 75 90 60C90 48.95 81.05 40 70 40Z"
            stroke="var(--signal)"
            strokeWidth="1.5"
          />
          <circle cx="70" cy="60" r="7" stroke="var(--signal)" strokeWidth="1.5" />
        </svg>
      </div>
    </section>
  );
}
