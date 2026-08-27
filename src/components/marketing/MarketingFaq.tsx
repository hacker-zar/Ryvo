import Icon from "@/components/ui/Icon";

const FAQS = [
  {
    question: "¿Cuánto cuesta una página?",
    answer:
      "El precio depende de lo que necesite tu negocio. Contánoslo en el formulario y te pasamos una cotización sin compromiso.",
  },
  {
    question: "¿Tengo que saber programación?",
    answer: "No.",
  },
  {
    question: "¿Tengo que diseñarla yo?",
    answer: "No. RYVO se encarga del diseño y la construcción de tu página.",
  },
  {
    question: "¿Puedo modificarla después?",
    answer:
      "Sí. Una vez que tu página está lista, vas a poder actualizar servicios, fotos, horarios y otros datos desde un panel simple, sin tocar código.",
  },
  {
    question: "¿Funciona desde el celular?",
    answer: "Sí. Las páginas están diseñadas para funcionar correctamente en celular.",
  },
  {
    question: "¿Dónde está disponible RYVO?",
    answer: "Actualmente en Rosario y alrededores.",
  },
];

export default function MarketingFaq() {
  return (
    <section id="faq" className="border-t border-graphite-line">
      <div className="mx-auto max-w-2xl px-4 py-20 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-porcelain text-center">
          Preguntas frecuentes
        </h2>

        <div className="mt-12 divide-y divide-graphite-line border-t border-b border-graphite-line">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-porcelain font-medium">
                {faq.question}
                <Icon
                  name="chevron"
                  size={20}
                  className="shrink-0 text-porcelain-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm text-porcelain-muted leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
