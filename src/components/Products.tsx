import Image from "next/image";
import { Business, Product, TemplateLayoutId } from "@/types/business";
import { formatPrice } from "@/lib/format";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";

interface ProductsProps {
  products: Product[];
  primaryColor: Business["primary_color"];
  layout?: TemplateLayoutId;
}

/**
 * Catálogo de productos — foto, nombre, precio y descripción opcional.
 * Nunca se muestra vacía en la web pública (mismo criterio que
 * Services/Gallery/Reviews): sin productos cargados, `null`. La sección
 * en sí se activa/ordena con el sistema de secciones ya existente (ver
 * section-order.ts) — acá no hay ningún interruptor propio.
 */
export default function Products({ products, primaryColor, layout }: ProductsProps) {
  if (products.length === 0) return null;

  const staggerDelay = (index: number) => 100 + Math.min(index, 5) * 60;

  // Ya trae su propio <Reveal> adentro (ver SectionHeader) — por eso los
  // usos de abajo NO lo envuelven en uno, que anidaría dos animaciones de
  // entrada sobre el mismo bloque.
  const sectionHeader = (title: string) => (
    <SectionHeader
      eyebrow="Catálogo"
      title={title}
      primaryColor={primaryColor}
      layout={layout}
    />
  );

  function imageOrPlaceholder(product: Product, sizes: string) {
    return product.image ? (
      <Image src={product.image} alt={product.name} fill sizes={sizes} className="object-cover" />
    ) : (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center text-bone-muted/50 text-xs"
      >
        Sin foto
      </div>
    );
  }

  // === NOIR — cards oscuras con borde, foto protagonista. ===
  if (layout === "noir") {
    return (
      <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
        {sectionHeader("Productos")}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={staggerDelay(i)}>
              <div
                data-editable-category="productos"
                data-editable-item={product.id}
                className="bg-ink-elevated border border-ink-line overflow-hidden group"
              >
                <div className="image-frame relative aspect-square bg-ink overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 768px) 40vw, 90vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    imageOrPlaceholder(product, "40vw")
                  )}
                </div>
                <div className="p-5">
                  <h3 className="display-title text-lg text-bone">{product.name}</h3>
                  <p className="ticket-number text-sm mt-1" style={{ color: primaryColor }}>
                    {formatPrice(product.price)}
                  </p>
                  {product.description ? (
                    <p className="mt-2 text-xs text-bone-muted leading-relaxed">
                      {product.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  // === STUDIO — grid parejo y limpio. ===
  if (layout === "studio") {
    return (
      <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
        {sectionHeader("Productos")}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={staggerDelay(i)}>
              <div data-editable-category="productos" data-editable-item={product.id}>
                <div className="image-frame relative aspect-square overflow-hidden bg-ink-elevated">
                  {imageOrPlaceholder(product, "(min-width: 768px) 30vw, 90vw")}
                </div>
                <h3 className="mt-3 text-bone font-medium">{product.name}</h3>
                <p className="ticket-number text-sm mt-1" style={{ color: primaryColor }}>
                  {formatPrice(product.price)}
                </p>
                {product.description ? (
                  <p className="mt-1 text-xs text-bone-muted leading-relaxed">
                    {product.description}
                  </p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  // === BOLD — cards grandes y expresivas, precio con tipografía enorme. ===
  if (layout === "bold") {
    return (
      <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
        {sectionHeader("Productos")}
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={staggerDelay(i)}>
              <div data-editable-category="productos" data-editable-item={product.id}>
                <div className="image-frame relative aspect-[4/3] overflow-hidden bg-ink-elevated">
                  {imageOrPlaceholder(product, "(min-width: 768px) 40vw, 90vw")}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <h3 className="display-title text-2xl md:text-3xl text-bone uppercase">
                    {product.name}
                  </h3>
                  <span
                    className="ticket-number text-2xl md:text-3xl shrink-0"
                    style={{ color: primaryColor }}
                  >
                    {formatPrice(product.price)}
                  </span>
                </div>
                {product.description ? (
                  <p className="mt-2 text-sm text-bone-muted leading-relaxed">
                    {product.description}
                  </p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  // === EDITORIAL — mosaico asimétrico, mismo mecanismo que Gallery.tsx:
  // nombre/precio superpuestos sobre la foto (sin descripción, para
  // mantener la lectura editorial limpia del mosaico). ===
  if (layout === "editorial") {
    const featurePattern = [true, false, false, true, false, false];
    return (
      <section id="catalogo" className="section-y">
        <div className="mx-auto max-w-5xl px-4">
          {sectionHeader("Productos")}
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[200px] gap-2 grid-flow-dense px-4 md:px-8">
          {products.map((product, i) => {
            const featured = featurePattern[i % featurePattern.length];
            return (
              <Reveal
                key={product.id}
                delay={staggerDelay(i)}
                className={featured ? "col-span-2 row-span-2" : ""}
              >
                <div
                  data-editable-category="productos"
                  data-editable-item={product.id}
                  className="image-frame relative w-full h-full overflow-hidden bg-ink-elevated group"
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 768px) 40vw, 90vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    imageOrPlaceholder(product, "40vw")
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-bone text-sm font-medium truncate">{product.name}</p>
                    <p className="ticket-number text-xs" style={{ color: primaryColor }}>
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    );
  }

  // === Atelier / default — editorial y espaciado, mucho aire. ===
  const isAtelier = layout === "atelier";
  return (
    <section id="catalogo" className="mx-auto max-w-5xl px-4 section-y">
      {sectionHeader("Productos")}
      <div
        className={`mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 ${
          isAtelier ? "lg:grid-cols-2" : "lg:grid-cols-3"
        }`}
      >
        {products.map((product, i) => (
          <Reveal key={product.id} delay={staggerDelay(i)}>
            <div data-editable-category="productos" data-editable-item={product.id}>
              <div className="image-frame relative aspect-[4/5] overflow-hidden bg-ink-elevated">
                {imageOrPlaceholder(product, "(min-width: 768px) 30vw, 90vw")}
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <h3 className="display-title text-xl text-bone">{product.name}</h3>
                <span className="ticket-number text-sm shrink-0" style={{ color: primaryColor }}>
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.description ? (
                <p className="mt-2 text-sm text-bone-muted leading-relaxed">
                  {product.description}
                </p>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
