"use client";

import Image from "next/image";
import { Business, Product } from "@/types/business";
import { formatPrice } from "@/lib/format";

export type ProductCardVariant = "list" | "grid";

interface ProductCardProps {
  product: Product;
  primaryColor: Business["primary_color"];
  variant: ProductCardVariant;
  onOpen: (id: string) => void;
}

/**
 * Una unidad de producto (foto opcional + nombre + precio + descripción)
 * — compartida por CatalogList, CatalogGrid y CatalogFeatured. Sin
 * imagen: nunca reserva el espacio ni muestra un placeholder, el texto
 * simplemente ocupa el lugar que hubiera sido de la foto.
 *
 * `<button>` en vez de un `div` con onClick — foco y activación por
 * teclado (Enter/Espacio) vienen gratis del elemento nativo, sin tener
 * que reimplementarlos. `data-product-card-id` es el ancla que usa
 * ProductDetail para devolver el foco acá al cerrarse.
 */
export default function ProductCard({ product, primaryColor, variant, onOpen }: ProductCardProps) {
  const image = product.image ? (
    <div
      className={`image-frame relative overflow-hidden bg-ink-elevated shrink-0 ${
        variant === "list" ? "h-16 w-16" : "aspect-square w-full"
      }`}
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes={variant === "list" ? "64px" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"}
        className="object-cover"
      />
    </div>
  ) : null;

  const name = <h3 className="text-bone font-medium">{product.name}</h3>;
  const price = (
    <span className="ticket-number text-sm shrink-0" style={{ color: primaryColor }}>
      {formatPrice(product.price)}
    </span>
  );
  const description = product.description ? (
    <p className="mt-1 text-sm text-bone-muted leading-relaxed line-clamp-2">
      {product.description}
    </p>
  ) : null;

  if (variant === "list") {
    return (
      <button
        type="button"
        data-editable-category="productos"
        data-editable-item={product.id}
        data-product-card-id={product.id}
        onClick={() => onOpen(product.id)}
        className="flex w-full items-start gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-sm"
      >
        {image}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            {name}
            {price}
          </div>
          {description}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-editable-category="productos"
      data-editable-item={product.id}
      data-product-card-id={product.id}
      onClick={() => onOpen(product.id)}
      className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-sm"
    >
      {image}
      <div className={image ? "mt-3" : ""}>
        <div className="flex items-start justify-between gap-3">
          {name}
          {price}
        </div>
        {description}
      </div>
    </button>
  );
}
