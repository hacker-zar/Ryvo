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

/** Monograma para los productos sin foto de la grilla — mismo criterio
 *  que el fallback de iniciales de Professionals.tsx, para no inventar
 *  un segundo estilo de "acá falta una imagen" en el mismo sitio. */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Una unidad de producto (foto opcional + nombre + precio + descripción)
 * — compartida por CatalogList, CatalogGrid y CatalogFeatured.
 *
 * Las dos variantes tratan la falta de foto distinto, a propósito: en
 * "list" el texto simplemente ocupa el lugar que hubiera sido de la foto
 * (una fila sin imagen no rompe la lista). En "grid" cada tarjeta es una
 * celda de una grilla: si unas reservan el cuadrado y otras no, las filas
 * quedan desparejas y el catálogo se lee como roto. Por eso la grilla
 * dibuja SIEMPRE el tile, con monograma cuando no hay imagen.
 *
 * `<button>` en vez de un `div` con onClick — foco y activación por
 * teclado (Enter/Espacio) vienen gratis del elemento nativo, sin tener
 * que reimplementarlos. `data-product-card-id` es el ancla que usa
 * ProductDetail para devolver el foco acá al cerrarse.
 */
export default function ProductCard({ product, primaryColor, variant, onOpen }: ProductCardProps) {
  const cardClasses =
    "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-sm";

  if (variant === "list") {
    const image = product.image ? (
      <div className="image-frame relative overflow-hidden bg-ink-elevated shrink-0 h-16 w-16">
        <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
      </div>
    ) : null;

    return (
      <button
        type="button"
        data-editable-category="productos"
        data-editable-item={product.id}
        data-product-card-id={product.id}
        onClick={() => onOpen(product.id)}
        className={`flex w-full items-start gap-4 py-5 ${cardClasses}`}
      >
        {image}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h3 className="text-bone font-medium">{product.name}</h3>
            <span className="ticket-number text-sm shrink-0" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </span>
          </div>
          {product.description ? (
            <p className="mt-1 text-sm text-bone-muted leading-relaxed line-clamp-2">
              {product.description}
            </p>
          ) : null}
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
      className={`group flex h-full w-full flex-col ${cardClasses}`}
    >
      <div className="image-frame relative aspect-square w-full overflow-hidden bg-ink-elevated">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className="ticket-number absolute inset-0 flex items-center justify-center text-3xl text-bone-muted/40"
          >
            {initials(product.name)}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-bone font-medium leading-snug">{product.name}</h3>
      {/* Una sola línea (no `line-clamp-2` como la lista): en la grilla la
          descripción cumple el papel del renglón corto de atributos, y dos
          líneas en unas tarjetas y una en otras vuelve a desalinear la
          fila. La descripción completa está en ProductDetail. */}
      {product.description ? (
        <p className="mt-1 text-sm text-bone-muted line-clamp-1">{product.description}</p>
      ) : null}

      {/* <span>, no <button>: la tarjeta entera YA es un <button>, y anidar
          dos controles es HTML inválido además de anunciarle al lector de
          pantalla dos acciones para un mismo destino. Esto es el afford
          visual del click, no un control aparte — por eso el hover lo
          dispara `group-hover` desde la tarjeta y no él mismo.
          `mt-auto` (con el `h-full flex-col` de la tarjeta): sin eso, un
          nombre de dos líneas empuja su botón más abajo que el de la
          tarjeta vecina y la fila queda escalonada. */}
      <span className="mt-auto pt-3 flex items-center justify-center gap-1.5 btn-radius border border-ink-line px-3 py-2.5 section-eyebrow text-[11px] text-bone-muted group-hover:border-brass group-hover:text-bone transition-colors">
        {product.price == null ? (
          formatPrice(product.price)
        ) : (
          <>
            Ver
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="ticket-number" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </span>
          </>
        )}
      </span>
    </button>
  );
}
