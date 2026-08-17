"use client";

import { useEffect } from "react";

/**
 * Conecta esta preview (renderizada dentro de un <iframe> same-origin en
 * el editor) con el panel de configuración del parent, vía postMessage:
 *
 * - Click en un elemento data-editable-* → se avisa al parent qué
 *   categoría/campo/ítem abrir, y se cancela la acción real del elemento
 *   (navegar, abrir el modal de reserva, etc. — acá estamos editando, no
 *   navegando).
 * - Mensaje del parent pidiendo resaltar un target (llegó por click en el
 *   panel, no en la preview) → scrollea hasta el elemento y le aplica el
 *   pulso de selección que ya existe (.select-pulse).
 */
export default function PreviewBridge() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-editable-category]");
      if (!el) return;

      event.preventDefault();
      event.stopPropagation();

      window.parent.postMessage(
        {
          type: "ryvo-editor-select",
          category: el.dataset.editableCategory,
          field: el.dataset.editableField,
          itemId: el.dataset.editableItem,
        },
        window.location.origin
      );
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ryvo-editor-highlight") return;

      const { category, field, itemId } = event.data as {
        category?: string;
        field?: string;
        itemId?: string;
      };
      if (!category) return;

      const selector = [
        `[data-editable-category="${category}"]`,
        field ? `[data-editable-field="${field}"]` : null,
        itemId ? `[data-editable-item="${itemId}"]` : null,
      ]
        .filter(Boolean)
        .join("");

      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("select-pulse");
      window.setTimeout(() => el.classList.remove("select-pulse"), 250);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
