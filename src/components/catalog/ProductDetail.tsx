"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { Business, Product } from "@/types/business";
import { formatPrice } from "@/lib/format";

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

        <div className="overflow-y-auto px-5 py-6 flex-1">
          {product.image ? (
            <div className="image-frame relative aspect-[4/3] overflow-hidden bg-ink-elevated mb-5">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 640px) 500px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <h2 id={titleId} className="display-title text-2xl text-bone">
            {product.name}
          </h2>
          <p className="ticket-number text-lg mt-2" style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </p>
          {product.description ? (
            <p className="mt-4 text-sm text-bone-muted leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          ) : null}
        </div>

        {onPrev || onNext ? (
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-ink-line">
            <button
              type="button"
              disabled={!onPrev}
              onClick={onPrev ?? undefined}
              aria-label="Producto anterior"
              className="h-10 w-10 flex items-center justify-center radius-sm border border-ink-line text-bone-muted hover:text-bone hover:border-brass disabled:opacity-30 transition-colors"
            >
              <Icon name="chevron" size={16} rotate={90} />
            </button>
            <button
              type="button"
              disabled={!onNext}
              onClick={onNext ?? undefined}
              aria-label="Producto siguiente"
              className="h-10 w-10 flex items-center justify-center radius-sm border border-ink-line text-bone-muted hover:text-bone hover:border-brass disabled:opacity-30 transition-colors"
            >
              <Icon name="chevron" size={16} rotate={270} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
