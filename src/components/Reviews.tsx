import { Business, Review, TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import Icon from "@/components/ui/Icon";

interface ReviewsProps {
  reviews: Review[];
  primaryColor: Business["primary_color"];
  layout?: TemplateLayoutId;
}

/** Estrellas del set propio (antes: los glifos ★/☆, que se dibujan
 *  distinto en cada sistema operativo y cambian de peso según la
 *  tipografía que eligió el negocio). */
function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <div
      className="flex gap-0.5"
      style={{ color }}
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name={i < rating ? "star-filled" : "star"} size={16} />
      ))}
    </div>
  );
}

export default function Reviews({ reviews, primaryColor, layout }: ReviewsProps) {
  if (reviews.length === 0) return null;

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section id="resenas" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader
        eyebrow="Clientes"
        title="Reseñas"
        primaryColor={primaryColor}
        layout={layout}
      />

      <Reveal delay={80}>
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
