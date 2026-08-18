import Reveal from "@/components/Reveal";

// Frase de marca grande — exclusiva de la plantilla Editorial. Usa la
// descripción del negocio (ya cargada, sin campo nuevo) como statement;
// no se muestra si el negocio no cargó descripción.
interface StatementProps {
  description: string;
  accentColor: string;
}

export default function Statement({ description, accentColor }: StatementProps) {
  if (!description) return null;

  return (
    <section className="py-16 md:py-28 border-b border-ink-line">
      <Reveal className="mx-auto max-w-3xl px-4 text-center">
        <p
          className="section-eyebrow mb-6"
          style={{ color: accentColor }}
        >
          Nuestra filosofía
        </p>
        <p className="display-title text-2xl sm:text-3xl md:text-5xl text-bone leading-[1.15]">
          {description}
        </p>
      </Reveal>
    </section>
  );
}
