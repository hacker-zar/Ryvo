"use client";

import { Business, Product } from "@/types/business";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";
import { useProductDetail } from "./useProductDetail";

interface CatalogGridProps {
  products: Product[];
  primaryColor: Business["primary_color"];
}

/** "Grilla" — 1 columna en mobile, 2 en tablet, 3 en desktop. Sección
 *  completa y autocontenida, mismo criterio que CatalogList. */
export default function CatalogGrid({ products, primaryColor }: CatalogGridProps) {
  const { openProduct, open, close, goPrev, goNext } = useProductDetail(products);

  return (
    <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader eyebrow="Catálogo" title="Productos" primaryColor={primaryColor} />
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={100 + Math.min(i, 5) * 60}>
            <ProductCard product={product} primaryColor={primaryColor} variant="grid" onOpen={open} />
          </Reveal>
        ))}
      </div>

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
