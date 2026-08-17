import { Business, Review } from "@/types/business";
import Reveal from "@/components/Reveal";

interface ReviewsProps {
  reviews: Review[];
  primaryColor: Business["primary_color"];
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

export default function Reviews({ reviews, primaryColor }: ReviewsProps) {
  if (reviews.length === 0) return null;

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section id="resenas" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <Reveal>
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          Clientes
        </p>
        <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
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
          filete fino entre reseñas, como el resto del sitio. */}
      <Reveal
        delay={100}
        className="mt-8 divide-y divide-ink-line border-t border-ink-line"
      >
        {reviews.map((review) => (
          <div key={review.id} className="py-6">
            <Stars rating={review.rating} color={primaryColor} />
            <p className="mt-3 text-sm md:text-base text-bone leading-relaxed max-w-2xl">
              {review.comment}
            </p>
            <p className="mt-3 text-xs text-bone-muted">
              {review.customer_name}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
