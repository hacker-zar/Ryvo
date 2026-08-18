import { Business, Review, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";

interface ReviewsProps {
  reviews: Review[];
  primaryColor: Business["primary_color"];
  layout?: TemplateLayoutId;
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <div
      className="flex gap-0.5 text-sm"
      style={{ color }}
      aria-label={`${rating} de 5 estrellas`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function Reviews({ reviews, primaryColor, layout }: ReviewsProps) {
  if (reviews.length === 0) return null;

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Editorial/Bold piden títulos más grandes y de mayor impacto en todas
  // las secciones — acá es lo único que cambia, la lista de reseñas en sí
  // no tiene un tratamiento distinto especificado por plantilla.
  const bigTitle = layout === "editorial" || layout === "bold";

  return (
    <section id="resenas" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <Reveal>
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          Clientes
        </p>
        <h2
          className={`display-title mt-2 text-bone ${
            bigTitle ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"
          }`}
        >
          Reseñas
        </h2>

        <div className="mt-8 flex items-center gap-3">
          <span className="ticket-number text-2xl text-bone">
            {average.toFixed(1)}
          </span>
          <Stars rating={Math.round(average)} color={primaryColor} />
          <span className="text-xs text-bone-muted">
            Basado en {reviews.length}{" "}
            {reviews.length === 1 ? "reseña" : "reseñas"}
          </span>
        </div>
      </Reveal>

      {/* Lista editorial, sin cards ni bordes: la separación es solo un
          filete fino entre reseñas, como el resto del sitio. Cada reseña
          en su propio Reveal (antes: una sola envolviendo la lista
          completa) para el stagger leve — divide-y sigue funcionando
          igual, el filete aparece entre los divs de Reveal. */}
      <div className="mt-8 divide-y divide-ink-line border-t border-ink-line">
        {reviews.map((review, i) => (
          <Reveal key={review.id} delay={100 + Math.min(i, 5) * 60}>
            <div className="py-6">
              <Stars rating={review.rating} color={primaryColor} />
              <p className="mt-3 text-sm md:text-base text-bone leading-relaxed max-w-2xl">
                {review.comment}
              </p>
              <p className="mt-3 text-xs text-bone-muted">
                {review.customer_name}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
