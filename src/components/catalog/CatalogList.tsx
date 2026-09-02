"use client";

import { Business, Product } from "@/types/business";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";
import { useProductDetail } from "./useProductDetail";

interface CatalogListProps {
  products: Product[];
  primaryColor: Business["primary_color"];
}

/**
 * "Lista" — formato tipo carta de precios, mismo lenguaje visual que la
 * lista de Servicios (Services.tsx): una fila por producto separada por
 * un filete (`divide-y`), nombre y precio en la misma línea. Sección
 * completa y autocontenida (igual que cada variante de Gallery.tsx) —
 * Products.tsx solo decide CUÁL de estas renderizar, no cómo.
 */
export default function CatalogList({ products, primaryColor }: CatalogListProps) {
  const { openProduct, open, close, goPrev, goNext } = useProductDetail(products);

  return (
    <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader eyebrow="Catálogo" title="Productos" primaryColor={primaryColor} />
      <div className="mt-10 divide-y divide-ink-line border-t border-b border-ink-line">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={100 + Math.min(i, 5) * 60}>
            <ProductCard product={product} primaryColor={primaryColor} variant="list" onOpen={open} />
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
