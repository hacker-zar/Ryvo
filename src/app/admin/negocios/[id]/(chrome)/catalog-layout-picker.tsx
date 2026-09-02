"use client";

import { useState } from "react";
import { CatalogLayoutId } from "@/types/business";
import { adminSetCatalogLayout } from "@/lib/admin/actions";

interface CatalogLayoutPickerProps {
  businessId: string;
  initialValue: CatalogLayoutId;
  productsWithImageCount: number;
  totalProducts: number;
  onSaved?: () => void;
}

interface LayoutOption {
  value: CatalogLayoutId;
  label: string;
  hint: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: "lista", label: "Lista", hint: "Carta de precios, una fila por producto" },
  { value: "grilla", label: "Grilla", hint: "Tarjetas en columnas, foto arriba" },
  { value: "destacados", label: "Destacados", hint: "Un producto grande arriba, el resto en lista" },
];

/**
 * Selector visual del layout de catálogo — tarjetas, no un <select>
 * (mismo criterio que TemplatePreviewCard: la vista previa dice más que
 * una etiqueta de texto). Guarda al instante en cada click (mismo
 * patrón que AboutImagePicker.tsx: sin botón "Guardar" propio, optimista
 * con rollback si falla) — a propósito NO se registra en el guardado
 * global del editor (setFormDirty/setFormSaveHandler): es una
 * preferencia de presentación, no un campo de contenido a revisar antes
 * de aplicar.
 */
export default function CatalogLayoutPicker({
  businessId,
  initialValue,
  productsWithImageCount,
  totalProducts,
  onSaved,
}: CatalogLayoutPickerProps) {
  const [selected, setSelected] = useState<CatalogLayoutId>(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function persist(value: CatalogLayoutId) {
    if (value === selected) return;
    const previous = selected;
    setSelected(value);
    setError("");
    setSaving(true);
    const result = await adminSetCatalogLayout(businessId, value);
    setSaving(false);
    if (result.success) {
      onSaved?.();
    } else {
      setSelected(previous);
      setError(result.error ?? "No se pudo guardar el cambio.");
    }
  }

  return (
    <div>
      <p className="section-eyebrow text-bone-muted mb-1">Estilo de catálogo</p>
      <p className="text-[11px] text-bone-muted/70 mb-3">
        {productsWithImageCount} de {totalProducts}{" "}
        {totalProducts === 1 ? "producto tiene" : "productos tienen"} foto cargada.
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {LAYOUT_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => persist(option.value)}
              aria-pressed={isSelected}
              className={`text-left radius-sm border overflow-hidden transition-colors disabled:opacity-50 ${
                isSelected ? "border-brass" : "border-ink-line hover:border-bone-muted"
              }`}
            >
              <div className="bg-ink-elevated p-3">
                <CatalogLayoutSketch layout={option.value} />
              </div>
              <div className="p-3">
                <p className="text-sm text-bone font-medium">
                  {option.label}
                  {isSelected ? (
                    <span className="ml-2 text-[10px] text-brass align-middle">Actual</span>
                  ) : null}
                </p>
                <p className="text-[11px] text-bone-muted mt-1">{option.hint}</p>
              </div>
            </button>
          );
        })}
      </div>

      {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
    </div>
  );
}

/** Boceto abstracto (sin datos reales) de cómo se acomoda cada layout —
 *  mismo espíritu que los bloques de color de TemplatePreviewCard. */
function CatalogLayoutSketch({ layout }: { layout: CatalogLayoutId }) {
  if (layout === "grilla") {
    return (
      <div className="grid grid-cols-3 gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-1">
            <div className="aspect-square radius-sm bg-ink-line" />
            <div className="h-1 w-3/4 rounded-full bg-ink-line" />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "destacados") {
    return (
      <div className="grid gap-2" aria-hidden>
        <div className="grid gap-1">
          <div className="aspect-[2/1] radius-sm bg-ink-line" />
          <div className="h-1 w-1/2 rounded-full bg-ink-line" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 shrink-0 radius-sm bg-ink-line/60" />
            <div className="h-1 flex-1 rounded-full bg-ink-line/60" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-5 w-5 shrink-0 radius-sm bg-ink-line" />
          <div className="flex-1 grid gap-1">
            <div className="h-1 w-2/3 rounded-full bg-ink-line" />
            <div className="h-1 w-1/3 rounded-full bg-ink-line/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
