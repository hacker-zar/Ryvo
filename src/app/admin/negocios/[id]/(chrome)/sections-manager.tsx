"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionConfig, SectionId } from "@/types/business";
import { adminUpdateSectionOrder } from "@/lib/admin/actions";
import { sanitizeSectionOrder } from "@/lib/section-order";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";

interface SectionsManagerProps {
  businessId: string;
  sectionOrder: SectionConfig[] | undefined;
}

const SECTION_LABELS: Record<SectionId, string> = {
  services: "Servicios",
  products: "Catálogo",
  professionals: "Profesionales",
  gallery: "Galería",
  about: "Sobre nosotros",
  reviews: "Reseñas",
  contact: "Contacto",
};

/**
 * Orden y visibilidad de las secciones del sitio público. "Inicio" se
 * muestra como fila fija sin controles (el hero es estructural, siempre
 * primero — ver SectionId en types/business.ts) solo para que la lista
 * coincida con el mental model de "así se ve tu página de arriba a
 * abajo". Persiste al instante en cada drag/click, sin botón "Guardar" —
 * mismo criterio que el reorder de profesionales.
 *
 * Drag & drop nativo (sin librería) para desktop/mouse, con flechas ▲▼
 * como mecanismo alternativo SIEMPRE disponible — el drag HTML5 no
 * soporta touch sin polyfill, y esto tiene que andar en mobile.
 */
export default function SectionsManager({
  businessId,
  sectionOrder,
}: SectionsManagerProps) {
  const router = useRouter();
  const { refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(() => sanitizeSectionOrder(sectionOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function persist(next: SectionConfig[]) {
    const previous = items;
    setItems(next);
    setError("");
    setSaving(true);
    const result = await adminUpdateSectionOrder(businessId, next);
    setSaving(false);
    if (result.success) {
      router.refresh();
      refreshPreview();
    } else {
      // Revierte el cambio optimista — si no, el interruptor/orden queda
      // mostrando algo que en realidad no se guardó, sin ningún aviso.
      setItems(previous);
      setError(result.error ?? "No se pudo guardar el cambio.");
    }
  }

  function handleToggle(id: SectionId) {
    persist(
      items.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function handleArrow(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const next = [...items];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    persist(next);
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault();
    setDragOverIndex(overIndex);
    const from = dragIndexRef.current;
    if (from === null || from === overIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    dragIndexRef.current = overIndex;
  }

  function handleDrop() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
    persist(items);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  return (
    <div className="mt-6">
      <p className="section-eyebrow text-bone-muted mb-1">
        Orden de secciones
      </p>
      <p className="text-[11px] text-bone-muted/70 mb-3">
        Arrastrá (☰) o usá las flechas para reordenar, y el interruptor
        para mostrar u ocultar cada sección. Una sección activada pero sin
        contenido (ej. Reseñas sin ninguna cargada) simplemente no se
        muestra en la web — no es un error.
      </p>
      {error ? (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      ) : null}

      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        <div className="py-3 flex items-center gap-3 opacity-60">
          <span className="text-bone-muted text-xs w-4 text-center" aria-hidden="true">
            ☰
          </span>
          <span className="flex-1 text-sm text-bone">Inicio</span>
          <span className="text-[11px] text-bone-muted/70">Fija</span>
        </div>

        {items.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`py-3 flex items-center gap-3 transition-colors ${
              dragOverIndex === index ? "bg-ink-elevated" : ""
            }`}
          >
            <span
              className="text-bone-muted text-xs w-4 text-center cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              ☰
            </span>
            <span className="flex-1 text-sm text-bone">
              {SECTION_LABELS[section.id]}
            </span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={index === 0 || saving}
                onClick={() => handleArrow(index, "up")}
                aria-label="Subir"
                className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors text-[10px] leading-none"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === items.length - 1 || saving}
                onClick={() => handleArrow(index, "down")}
                aria-label="Bajar"
                className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors text-[10px] leading-none"
              >
                ▼
              </button>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={section.enabled}
              aria-label={section.enabled ? "Ocultar sección" : "Mostrar sección"}
              disabled={saving}
              onClick={() => handleToggle(section.id)}
              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                section.enabled ? "bg-brass" : "bg-ink-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${
                  section.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
