"use client";

import Image from "next/image";
import { Business, Product } from "@/types/business";
import { formatPrice } from "@/lib/format";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";
import { useProductDetail } from "./useProductDetail";

interface CatalogFeaturedProps {
  products: Product[];
  primaryColor: Business["primary_color"];
}

/**
 * "Destacados" — el producto con el `display_order` más bajo (el
 * primero del orden que ya eligió el negocio, sin un campo `featured`
 * aparte) se muestra grande arriba; el resto, en la misma lista tipo
 * carta de precios que ya usa CatalogList (reutiliza ProductCard
 * variant="list", no duplica esa presentación). El destacado queda
 * primero en el orden natural del documento, así que en mobile ya
 * aparece arriba sin necesidad de ningún truco de order/flex.
 */
export default function CatalogFeatured({ products, primaryColor }: CatalogFeaturedProps) {
  const [featured, ...rest] = products;
  const { openProduct, open, close, goPrev, goNext } = useProductDetail(products);

  return (
    <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader eyebrow="Catálogo" title="Productos" primaryColor={primaryColor} />

      <Reveal delay={100}>
        <button
          type="button"
          data-editable-category="productos"
          data-editable-item={featured.id}
          data-product-card-id={featured.id}
          onClick={() => open(featured.id)}
          className={`mt-10 grid w-full gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-sm ${
            featured.image ? "md:grid-cols-[minmax(0,380px)_1fr] md:items-center" : "max-w-2xl"
          }`}
        >
          {featured.image ? (
            <div className="image-frame relative aspect-[4/3] overflow-hidden bg-ink-elevated">
              <Image
                src={featured.image}
                alt={featured.name}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div>
            <h3 className="display-title text-2xl md:text-3xl text-bone">{featured.name}</h3>
            <p className="ticket-number text-xl mt-2" style={{ color: primaryColor }}>
              {formatPrice(featured.price)}
            </p>
            {featured.description ? (
              <p className="mt-3 text-sm md:text-base text-bone-muted leading-relaxed line-clamp-2">
                {featured.description}
              </p>
            ) : null}
          </div>
        </button>
      </Reveal>

      {rest.length > 0 ? (
        <div className="mt-10 divide-y divide-ink-line border-t border-b border-ink-line">
          {rest.map((product, i) => (
            <Reveal key={product.id} delay={100 + Math.min(i + 1, 5) * 60}>
              <ProductCard product={product} primaryColor={primaryColor} variant="list" onOpen={open} />
            </Reveal>
          ))}
        </div>
      ) : null}

      {openProduct ? (
        <ProductDetail
          product={openProduct}
          primaryColor={primaryColor}
          onClose={close}
          onPrev={goPrev}
          onNext={goNext}
          returnFocusId={openProduct.id}
        />
      ) : null}
    </section>
  );
}
