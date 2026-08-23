"use client";

import { useState } from "react";
import Image from "next/image";
import { adminUpdateBusiness } from "@/lib/admin/actions";

interface AboutImagePickerProps {
  businessId: string;
  gallery: string[];
  initialValue: string;
  /** Igual que GalleryUploadField.onSaved — refresca la preview en vivo. */
  onSaved?: () => void;
}

/**
 * Elegir (de la galería ya cargada) qué foto usa la sección "Quiénes
 * somos" — no un uploader nuevo: reutiliza las fotos que el negocio ya
 * subió en Galería, sin un segundo sistema de subida de imágenes.
 * Persiste al instante en cada click (mismo criterio que Galería, que
 * está justo al lado: sin botón "Guardar" propio), vía la misma
 * `adminUpdateBusiness` genérica que ya usa fotos-panel.tsx — optimista
 * con rollback si falla, mismo patrón que SectionsManager.
 *
 * Vacío = sin elegir explícitamente → About.tsx cae a `gallery[0]` como
 * antes (compatibilidad con negocios existentes, ver About.tsx).
 */
export default function AboutImagePicker({
  businessId,
  gallery,
  initialValue,
  onSaved,
}: AboutImagePickerProps) {
  const [selected, setSelected] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function persist(value: string) {
    const previous = selected;
    setSelected(value);
    setError("");
    setSaving(true);
    const formData = new FormData();
    formData.set("about_image", value);
    const result = await adminUpdateBusiness(businessId, formData);
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
      <p className="section-eyebrow text-bone-muted mb-1">
        Imagen de &quot;Quiénes somos&quot;
      </p>
      <p className="text-[11px] text-bone-muted/70 mb-3">
        Elegí qué foto de la galería se usa en la sección &quot;Quiénes
        somos&quot; — queda fija aunque después reordenes la galería.
      </p>

      {gallery.length === 0 ? (
        <p className="text-xs text-bone-muted">
          Subí fotos a la galería para poder elegir una acá. Mientras tanto
          se usa la primera foto de la galería automáticamente.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                type="button"
                disabled={saving}
                onClick={() => persist(src)}
                aria-label='Usar esta foto para "Quiénes somos"'
                aria-pressed={selected === src}
                className={`relative aspect-square overflow-hidden radius-sm border transition-colors disabled:opacity-50 ${
                  selected === src
                    ? "border-brass ring-2 ring-brass/50"
                    : "border-ink-line hover:border-bone-muted"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>

          {selected ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist("")}
              className="mt-2 text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Quitar selección (usar la primera foto de la galería)
            </button>
          ) : (
            <p className="mt-2 text-[11px] text-bone-muted/70">
              Sin elegir — se usa automáticamente la primera foto de la
              galería.
            </p>
          )}
        </>
      )}

      {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
    </div>
  );
}
