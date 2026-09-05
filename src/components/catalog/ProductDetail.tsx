"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { Business, Product } from "@/types/business";
import { formatPrice, initials } from "@/lib/format";

interface ProductDetailProps {
  product: Product;
  primaryColor: Business["primary_color"];
  onClose: () => void;
  /** null = no hay anterior, o solo hay un producto en el catálogo. */
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  /** data-product-card-id de la card que abrió esto — a dónde devolver
   *  el foco al cerrar. */
  returnFocusId: string;
}

/**
 * Detalle de un producto — un único componente responsive (mismo
 * esqueleto que BookingModal/ConfirmDialog: overlay + hoja con
 * `sheet-radius`, `anim-fade`/`anim-slide-up` ya existentes, que en
 * mobile da un sheet desde abajo y en desktop una tarjeta centrada). Sin
 * modal separado para cada breakpoint.
 *
 * A diferencia de BookingModal/ConfirmDialog, este SÍ necesita foco
 * atrapado (Tab no se escapa) y navegación con flechas entre productos
 * — ninguno de los diálogos existentes lo tenía para copiar, así que se
 * implementa acá con el manejo de teclado más simple que cumple el
 * pedido (sin librería nueva).
 */
export default function ProductDetail({
  product,
  primaryColor,
  onClose,
  onPrev,
  onNext,
  returnFocusId,
}: ProductDetailProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `product-detail-title-${product.id}`;

  // Bloqueo de scroll del body mientras está abierto — restaura el
  // valor ORIGINAL (no simplemente ""), igual que ya hace BookingModal.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Foco al abrir — al botón de cerrar, siempre presente y siempre el
  // primer elemento interactivo del diálogo.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Devuelve el foco a la card que abrió el detalle, al desmontar.
  useEffect(() => {
    return () => {
      if (typeof CSS === "undefined" || !CSS.escape) return;
      const trigger = document.querySelector<HTMLElement>(
        `[data-product-card-id="${CSS.escape(returnFocusId)}"]`
      );
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape cierra, flechas cambian de producto, Tab no escapa del
  // diálogo (focus trap manual — ni BookingModal ni ConfirmDialog lo
  // necesitaban, así que no había nada que reusar acá).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && onPrev) {
        onPrev();
        return;
      }
      if (e.key === "ArrowRight" && onNext) {
        onNext();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      // Por debajo de BookingModal (z-[100]): si desde acá se abre el
      // wizard de reserva, ese tiene que quedar por encima. Por encima
      // de Header/MobileBookingBar (ninguno pasa de z-50).
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-lg sm:mx-4 bg-ink border border-ink-line sheet-radius max-h-[92vh] sm:max-h-[85vh] flex flex-col anim-slide-up"
      >
        <div className="shrink-0 flex items-center justify-end px-5 py-4 border-b border-ink-line">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-bone-muted hover:text-bone focus-visible:ring-2 focus-visible:ring-brass radius-sm transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* La foto manda: cuadrada y a sangre (antes 4:3 con padding
              lateral y media pantalla de alto). En el detalle la imagen ES
              el contenido, no una ilustración del texto. Se dibuja siempre
              — con monograma si falta — para que el diálogo no cambie de
              forma según cada producto y para que las flechas tengan
              dónde vivir. Sin foto va más bajo (2:1 en vez de cuadrado):
              un cuadrado entero de monograma se come media pantalla de
              mobile para no decir nada, y hoy hay negocios sin una sola
              foto cargada. */}
          <div
            className={`image-frame relative w-full overflow-hidden bg-ink-elevated ${
              product.image ? "aspect-square" : "aspect-[2/1]"
            }`}
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 640px) 512px, 100vw"
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="ticket-number absolute inset-0 flex items-center justify-center text-5xl text-bone-muted/40"
              >
                {initials(product.name)}
              </span>
            )}

            {/* Anterior/siguiente pasaron del pie a los costados de la
                foto: es donde se las busca, y libera el pie del diálogo.
                Fondo propio semiopaco porque acá se apoyan sobre la foto
                del negocio, de la que no se puede asumir ningún color. */}
            {onPrev || onNext ? (
              <>
                <button
                  type="button"
                  disabled={!onPrev}
                  onClick={onPrev ?? undefined}
                  aria-label="Producto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center radius-sm border border-ink-line bg-ink/80 backdrop-blur-sm text-bone hover:border-brass disabled:opacity-0 transition-colors"
                >
                  <Icon name="chevron" size={16} rotate={90} />
                </button>
                <button
                  type="button"
                  disabled={!onNext}
                  onClick={onNext ?? undefined}
                  aria-label="Producto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center radius-sm border border-ink-line bg-ink/80 backdrop-blur-sm text-bone hover:border-brass disabled:opacity-0 transition-colors"
                >
                  <Icon name="chevron" size={16} rotate={270} />
                </button>
              </>
            ) : null}
          </div>

          <div className="px-5 py-6">
            <h2 id={titleId} className="display-title text-2xl text-bone">
              {product.name}
            </h2>
            {/* El precio sube de text-lg a text-2xl y a renglón propio: en
                la referencia es el segundo dato que se lee, no una nota al
                pie del título. */}
            <p className="ticket-number text-2xl mt-3" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </p>

            {/* La descripción deja de ser un párrafo suelto y pasa a ser
                una sección rotulada bajo un filete, como los bloques
                desplegables de una ficha de producto real. */}
            {product.description ? (
              <div className="mt-6 border-t border-ink-line pt-5">
                <h3 className="section-eyebrow text-[11px] text-bone-muted">Descripción</h3>
                <p className="mt-3 text-sm text-bone-muted leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
