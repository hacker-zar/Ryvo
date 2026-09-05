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

/** "Grilla" — 2 columnas ya en mobile, 4 en desktop. Sección completa y
 *  autocontenida, mismo criterio que CatalogList.
 *
 *  Dos columnas en mobile (y no una) es deliberado: el catálogo se mira
 *  para comparar productos entre sí, y a una por pantalla hay que
 *  scrollear para saber qué más hay. El tile cuadrado sostiene el ancho
 *  chico sin recortar la foto. */
export default function CatalogGrid({ products, primaryColor }: CatalogGridProps) {
  const { openProduct, open, close, goPrev, goNext } = useProductDetail(products);

  return (
    <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
      <SectionHeader eyebrow="Catálogo" title="Productos" primaryColor={primaryColor} />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={100 + Math.min(i, 5) * 60} className="h-full">
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
