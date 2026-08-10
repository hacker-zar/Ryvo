import { Business, Review } from "@/types/business";

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

  return (
    <section id="resenas" className="mx-auto max-w-5xl px-4 py-16 md:py-24">
      <p className="section-eyebrow" style={{ color: primaryColor }}>
        Clientes
      </p>
      <h2 className="section-title mt-2 text-2xl md:text-4xl text-bone">
        Reseñas
      </h2>
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-sm border border-ink-line bg-ink-elevated p-5"
          >
            <Stars rating={review.rating} color={primaryColor} />
            <p className="mt-3 text-sm text-bone leading-relaxed">
              {review.comment}
            </p>
            <p className="mt-3 text-xs text-bone-muted">
              {review.customer_name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
